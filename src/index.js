/*
* iconfont fis3
* 依赖具体的项目目录结构
* 字体生成到modules/common/fonts目录下面
* 对应的css直接插入到了页面中
* 目前的目录结构
* -src
* -----|lego_modules
* -----|modules
* -----|pages
* ----------|index
* ---------------|main.js
* ----------|test
* ---------------|main.js
* -----partials
* -----index.html
* -----test.html
* -----fis-conf.js
* -----package.json
 */


/*
* 1. 遍历项目下所有的html, tpl, js 文件中的icon
* 2. 生成字体文件
* 3. 生成css文件，
* 4. 所有项目根目录下的html以inline或者link方式引入样式
*
* 每个html文件都引入了项目下的所有icon相关的样式，非按需加载方式
 */
'use strict';

var path = require('path'),
    fs = require('fs'),
    _ = fis.util,
    icon = require('./iconfont.js');

var iconfontTag = new RegExp('<!--ICONFONT_PLACEHOLDER-->');


// 数组去重
function uniqList(arr) {
    var ret = [],
        tmpl = {},
        item;
    for(var k=0,len=arr.length; k<len; k++){
        item = arr[k];
        if(!tmpl[item]){
            tmpl[item] = 1;
            ret.push(item);
        }
    }
    return ret;
}


/*
* 匹配文本中的icon
 */
function getIconMatches (content, iconReg, cleanIconReg) {
    var matches = content.match(iconReg);
    if(matches){
        for(var i=0; i<matches.length; i++){
            matches[i] = matches[i].replace(cleanIconReg, '');
        }
    }
    return matches || [];
}



module.exports = function (ret, conf, settings, opt) {

    var files = ret.src,
        res = ret.map.res,
        sources = _.toArray(files);

    var projectPath = fis.project.getProjectPath(),
        iconPrefix = settings.classPrefix,
        iconReg = new RegExp('icon-font\\\s' + iconPrefix + '([a-zA-Z0-9\\\-_]*)', 'mg'),
        cleanIconReg = new RegExp('icon-font\\\s' + iconPrefix, 'g');
        // iconReg = new RegExp('[\\\s\\\'\\\"]' + iconPrefix + '([a-zA-Z0-9\\\-_]*)', 'mg'),
        // cleanIconReg = new RegExp('[\\\s\\\'\\\"]' + iconPrefix, 'g');

    // 默认的字体文件名是iconfont.ttf
    settings.output = settings.output + '/iconfont';
    var fontOutPath = path.join(projectPath, sources[0].deploy.to);
    settings.fontsOutput = path.join(fontOutPath, settings.output);

    //  所有svg 的字体文件都生成了，实际上没有必要
    // icon.genarateFonts(settings);

    var ignoreLibList = settings.ignore ||  ['zepto', 'badjs', 'mod', 'bj-report', 'tools', 'db'];

    /*
    * 先根据icon的顺序，生成content
    * 所有的icon遍历出来后，根据icon查找svg，生成对应的字体问题。
    * 确保数序，否则content会错乱
     */
    
    var pages = [],
        ext,
        content,
        eachFileIconList = [],
        allIconList = []; 
        // whole project icon list
    _.map(files, function(subpath, file) {
        ext = _.ext(file.toString());
        content = file.getContent();
        // src 目录下的 html文件
        // ~['.html', '.js', '.tpl']
        if(~['.html', '.tpl'].indexOf(ext.ext)) {
            
            eachFileIconList = getIconMatches(content, iconReg, cleanIconReg);
            if(eachFileIconList.length > 0) {
                allIconList = allIconList.concat(eachFileIconList);
            }
            
            // 需要添加css的页面
            // 项目根目录下面的html文件，认定为是业务页面，需要添加字体文件
            if(ext.dirname === projectPath ) {
                pages.push(file);
            }
        } else if(ext.ext === '.js' && ~~ignoreLibList.indexOf(ext.filename)) {
            
            // 基础库忽略查找
            // js 中iconfont查找方式不同 addClass('i-xxx');
            
            var matches = content.match(/addClass\(\'([^\'\s]*\s)?i-([^\'\s]*)/mg);
            if(matches){
                // iconfont 无法覆盖
                // 场景 html 标签上已经有 i-a
                // 依赖的js中有addClass('i-b')，这里没法确保覆盖
                matches.forEach(function(match, i) {
                    matches[i] = matches[i].replace(/addClass\(\'([^\'\s]*\s)?i-/, '');
                });
                allIconList = allIconList.concat(matches);
            }
            
        }
    });


    // 整个项目中的icon
    allIconList = uniqList(allIconList);

    /*
    * 按需生成字体文件
     */
    icon.genarateFonts(settings, allIconList);

    var cssContent = icon.generateCss(allIconList, settings.pseClass);
    var ttfPath = settings.output + '.ttf';
    ttfPath = settings.ttfCdn + '/' + ttfPath;

    console.log(ttfPath);

    cssContent = cssContent.replace('{{$path}}', ttfPath);

    fs.writeFileSync(path.join(path.dirname(settings.fontsOutput), 'font.css'), cssContent, 'utf-8');

    // inline 方式引入
    var inlineCss = '<style>\r\n' + cssContent + '\r\n</style>';
    // 外链方式引入
    if(settings.cssCdn) {
        inlineCss = '<link rel="stylesheet" type="text/css" href="' + settings.cssCdn + '/' + path.join(path.dirname(settings.output), 'font.css').replace(/\\/g, '/') + '" />\r\n';
    }
    pages.forEach(function(page) {
        var content = page.getContent();
        if(iconfontTag.test(content)) {
            content = content.replace(iconfontTag, inlineCss);
        } else {
            content = content.replace('</head>', '\t' + inlineCss + '$&');
        }      
        page.setContent(content);
    });
};