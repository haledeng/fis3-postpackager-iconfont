# fis3-postpackager-iconfont



### 安装
```
npm install fis3-postpackager-iconfont --save
```


### 背景

项目中使用iconfont时，需要将 SVG 转化成 font 字体文件，同时解决字体css的引入的问题，整个流程比较繁琐。


### 目标
在 html 标签上挂载和 svg 同名（或者有映射关系）的类名，构建解决：
+ SVG 转化 字体文件
+ css 的引入问题
通过上面的方式，可以使`iconfont 的使用对开发透明` 。
最终生成的字体存放在一个可配置的目录下，同时字体的css引入直接插入到html中, 在html中使用 `<!--ICONFONT_PLACEHOLDER-->`，占位符指明最终css的插入位置，如未执行，则会插入在  `</head>之前`

### 使用方式
fis-conf.js 配置
```
// settings
postpackager: fis.plugin('iconfont', {
    // 遍历js时，可以忽略的基础库
    ignore: ['zepto', 'badjs', 'mod', 'bj-report', 'tools', 'db.js'],
    // 匹配的icon前缀，即类名是i-xxx
    classPrefix: 'i-',
    // 本地svg路径，方便生成字体文件，这里可以使用脚本同步iconfont平台上的svg
    svgPath: '../svgs',
    // 字体的产出路径
    output: 'modules/common/fonts',
    // 引用字体的cdn前缀
    ttfCdn: 'http://7.url.cn/edu/activity/' + name,
    // 引用字体样式的cdn前缀，如果配置了该属性，
    // 最终的字体样式会已link方式引入到页面，
    // 否则会inline到页面中的占位符位置 <!--ICONFONT_PLACEHOLDER--> ，或者</head>前
    // 文件 md5
    useHash: true,
    cssCdn: 'http://7.url.cn/edu/activity/' + name,
    // 字体content使用的伪类，只能填after或者before，默认为after
    pseClass: 'before' // 伪类名
})
```



