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
* 1. 分析html A 深层次依赖 js, tpl 等
* 2. 分析js和tpl中的icon， 分析依据：
*     1）html,tpl中有iconfont i-xxx类名
*     2）js 中有addClass('i-xxx');
* 3. 将icon生成css，插入到html文件中
* 4. 根据项目所有的iconList，生成字体文件
*
*
* html 按需加载依赖的icon
 */
'use strict';

var path = require('path'),
    fs = require('fs'),
    _ = fis.util,
    icon = require('./iconfont.js');

var iconfontTag = new RegExp('<!--ICONFONT_PLACEHOLDER-->');

/*
* 递归计算文件依赖
 */
function getDeps(file, res) {
    var ret = [],
        deps = (res[file] || {}).deps || [],
        subDeps;
    for(var i=0;i<deps.length;i++) {
        subDeps = (res[deps[i]] || {}).deps || [];
        if(subDeps.length === 0) {
            ret.push(deps[i]);
        } else {
            ret = ret.concat(getDeps(deps[i], res));
        }
    }
    return ret;
}


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
    return matches || {];
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

    
    settings.output = settings.output + '/iconfont';
    var fontOutPath = path.join(projectPath, sources[0].deploy.to);
    settings.fontsOutput = path.join(fontOutPath, settings.output);

    //  所有svg 的字体文件都生成了，实际上没有必要
    // icon.genarateFonts(settings);

    var ignoreLibList = settings.ignore ||  ['zepto', 'badjs', 'mod', 'bj-report', 'tools', 'db.js'];

    /*
    * 获取html所有依赖项中的icon
    * js 匹配方式方式不同，参考index.js
     */
    function getHtmlDepsIcons(deps) {
        var icons = [],
            fileIcons,
            content,
            isLegoMod = false,
            file,
            fileInfo;
        for(var i=0;i<deps.length;i++) {
            file = deps[i];
            fileInfo = ret.ids[file];
            isLegoMod = /\d\.\d\.\d/.test(file);
            // 过滤基础库
            // 过滤这里可能过滤modules/common中的库
            if(isLegoMod) {
                var moduleName = file.replace(/\/\d\.\d\.\d(.*)/, '');
                if(!ignoreLibList.indexOf(moduleName)) {
                    continue;
                }
            }
            // 过滤css
            if(~['.scss', '.css'].indexOf(fileInfo.ext)) {
                continue;
            }
            // js and tpl files
            content = fs.readFileSync(fileInfo.fullname).toString();
            // js 和 tpl 的匹配方式不同
            if(fileInfo.ext === '.js') {
                var matches = content.match(/addClass\(\'([^\'\s]*\s)?i-([^\'\s]*)/mg);
                if(matches){
                    // iconfont 无法覆盖
                    // 场景 html 标签上已经有 i-a
                    // 依赖的js中有addClass('i-b')，这里没法确保覆盖
                    matches.forEach(function(match, i) {
                        matches[i] = matches[i].replace(/addClass\(\'([^\'\s]*\s)?i-/, '');
                    });
                    fileIcons = matches;
                }

            } else if(fileInfo.ext === '.tpl') {
                fileIcons = getIconMatches(content, iconReg, cleanIconReg);
            }
            
            if(fileIcons) {
                icons = icons.concat(fileIcons);
            }

        }
        return icons;
    }
    /*
    * 先根据icon的顺序，生成content
    * 所有的icon遍历出来后，根据icon查找svg，生成对应的字体问题。
    * 确保数序，否则content会错乱
     */
    
    // console.log(res);
    var svgCnt = 0,
        allIconList = []; // whole project icon list
    _.map(files, function(subpath, file) {
        var ext = _.ext(file.toString());
        // src 目录下的 html文件
        if(ext.ext === '.html' && ext.dirname === projectPath) {
            var content = file.getContent();
            var htmlIcons = getIconMatches(content, iconReg, cleanIconReg);          
            // entry js file
            // html 入口文件，pages下同名目录下的main.js
            var entry = 'pages/' + ext.filename + '/main.js';

            // 入口文件依赖
            var jsDeps = ((res[entry].extras || {}).async || []).concat(res[entry].deps || []);
            var deepDeps = [];
            // 文件的深层次依赖
            for(var i=0;i<jsDeps.length;i++) {
                deepDeps = deepDeps.concat(getDeps(jsDeps[i], res));
            }   
            // 所有依赖
            deepDeps = uniqList(jsDeps.concat(deepDeps));
            // 依赖文件中包含的icon
            var iconList = htmlIcons.concat(getHtmlDepsIcons(deepDeps));
            var ttfPath = settings.output + '.ttf';
            if(iconList.length > 0) {

                // var cssContent = icon.generateCss(iconList, settings.pseClass);
                var cssContent = icon.generateCss(iconList, settings.pseClass, svgCnt);
                svgCnt += iconList.length;
                allIconList = allIconList.concat(iconList);
                ttfPath = settings.ttfCdn + '/' + ttfPath;
                cssContent = cssContent.replace('{{$path}}', ttfPath);
                if(iconfontTag.test(content)) {
                    content = content.replace(iconfontTag, '<style>\r\n' + cssContent + '\r\n</style>');
                } else {
                    content = content.replace('</head>', '<style>\r\n' + cssContent + '\r\n</style>\r\n$&');
                }
                
                file.setContent(content);
            }
        }
    });
    /*
    * 按需生成字体文件
     */
    icon.genarateFonts(settings, allIconList);
};