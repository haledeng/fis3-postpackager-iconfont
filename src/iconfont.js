/*
 生成字体文件，
 生成字体 content
 */
'use strict';
var fs = require('fs'),
    path = require('path'),
    fontCarrier = require('font-carrier');


// 十进制 转 16进制
function decimal2Hex(n){
    var hex = n.toString(16);
    hex = '000'.substr(0, 3 - hex.length) + hex;
    return hex;
}

// 生成 icon 对应的 content
function generateIconContent(n){
    return '&#xf' + decimal2Hex(n);
}

function mkdir(dir) {
    if(!fs.existsSync(dir)) {
        mkdir(path.dirname(dir));
        fs.mkdirSync(dir);
    }
}

/*
* generate font files
*/
exports.genarateFonts = function (opt, icons) {
    var svgPath = opt.svgPath,
        output = opt.fontsOutput,
        font = fontCarrier.create(),
        svgsObj = {},
        filePath,
        iconContent;
    icons.forEach(function(icon, index){
        filePath = path.join(svgPath, icon + '.svg');
        if(fs.existsSync(filePath)) {
            iconContent = generateIconContent(index);
            svgsObj[iconContent] = fs.readFileSync(filePath).toString();
        } else {
            fis.log.error(filePath + ' svg file does not exist!');
        }

    });

    font.setSvg(svgsObj);

    var outputDir = path.dirname(output);
    mkdir(outputDir);
    // 导出字体
    font.output({
        path: output
    });
};

/*
* 根据icon生成对应的字体
 */
exports.generateCss = function (iconNames, pseClass, start, step) {
    var self = this,
        pseudoClass = ~['after', 'before'].indexOf(pseClass) ? pseClass : 'after',
        start = start || 0,
        step = step || 1;

    var content = [],
        iconContent;
    // 字体的引用和每个css的引入路径有关系
    content.push('@font-face { ');
    content.push('font-family: "mfont";');
    content.push('src: url("{{$path}}") format("truetype");}');
    content.push('.icon-font{font-family:"mfont";font-size:16px;font-style:normal;font-weight: normal;font-variant: normal;text-transform: none;line-height: 1;position: relative;-webkit-font-smoothing: antialiased;}');
    iconNames.forEach(function(iconName){
        iconContent = generateIconContent(start++);
        // iconContent = maps[iconName] || '';
        if (typeof iconContent !== 'undefined') {
            iconContent = iconContent.replace('&#xf', '\\f');
            content.push('.i-' + iconName + ':' + pseudoClass + '{content: "' + iconContent + '";}');
        }
    });
    return content.join('\r\n');
};


exports.exportCssFile = function(iconNames, pseClass, path) {
    var content = this.generateCss(iconNames, pseClass);
    fs.writeFileSync(path, content, 'utf-8');
}