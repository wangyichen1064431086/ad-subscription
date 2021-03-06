const nunjucks = require('nunjucks');
const gulp = require('gulp');
const fs = require('fs-jetpack');
const path = require('path');
const browserSync = require('browser-sync').create();
const $ = require('gulp-load-plugins')();
const rollup = require('rollup').rollup;
const babel = require('rollup-plugin-babel');
const nodeResolve = require('rollup-plugin-node-resolve');
const del = require('del');
const rollupUglify = require('rollup-plugin-uglify');
const minifyEs6 = require('uglify-es').minify;
const merge = require('merge-stream');
var cache;
const env = new nunjucks.Environment(
  new nunjucks.FileSystemLoader(['views'],{
    watch:false,//MARK:如果为true，则会导致html任务挂在那儿
    noCache:true
  }),
  {
    autoescape:false
  }
);

env.addFilter('addSearchParam', (str, param) => {
  const hashIndex = str.indexOf('#');
  const hashStr = hashIndex > 0 ? str.substr(hashIndex) : '';
  const strWithOutHashStr = hashIndex > 0 ? str.substring(0, hashIndex) : str;
  
  if (strWithOutHashStr.includes('?')) {
    //去掉原有ccode
    const strWithOutHashStrWithOutCcode = strWithOutHashStr.replace(/ccode=[a-zA-Z0-9]+&?/,'');
    return `${strWithOutHashStrWithOutCcode}&${param}${hashStr}`;
  } 
  return `${strWithOutHashStr}?${param}${hashStr}`;
});
function render(template, context) {
  return new Promise(function(resolve, reject) {
      env.render(template,context,function(err,res) {
        if(err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
  });
}

gulp.task('html', async () => {
  const destDir = '.tmp';
  const dataFileArr = fs.find('data', {
    matching:'*.json',
    files:true,
    directories:false,
    recursive:false
  });
  const pageNameArr = dataFileArr.map(item => {
    return path.basename(item, '.json');
  })
  const renderOnePage = function(name) {
    return new Promise(
      async function(resolve, reject) {
        const destDir = '.tmp';
        const dataForRender = await fs.readAsync(`data/${name}.json`, 'json');
        const templateForRender = `${name}.html`;
        const resultForRender = await render(templateForRender, dataForRender);
        const destFileForRender = path.resolve(destDir, templateForRender);
        const resolveInfo = {
          resultForRender,
          destFileForRender
        };
        resolve(resolveInfo);
      }
    ).then(resolve => {
      fs.writeAsync(resolve.destFileForRender, resolve.resultForRender)
    }).catch(error => {
      console.log(error);
    });
  };
  // renderOnePage函数也可以不用promise,直接用async await读、渲染、写

  return Promise.all(pageNameArr.map(item => {
    return renderOnePage(item);
  })).then(() => {
    browserSync.reload('*.html')
  }).catch(error => {
    console.log(error);
  })
});

/*
gulp.task('html',async function() {
  const destDir = '.tmp';
  const dataForRender = await fs.readAsync('data/adForRadio.json','json');//await 可以获取promise中resolve的值
  const renderResult = await render('adForNews.html',dataForRender);
  await fs.writeAsync(`${destDir}/adForRadio.html`,renderResult);
  browserSync.reload('*.html');
});
*/

gulp.task('script',() => {
  // TODO:关于rollup需要再认真学习一下
   return rollup({
     entry:'client/js/main.js',
     cache: cache,
     plugins:[
       babel({//这里需要配置文件.babelrc
         exclude:'node_modules/**'
       }),
       nodeResolve({
         jsnext:true,
       }),
       rollupUglify({},minifyEs6)
     ]
   }).then(function(bundle) {
     cache = bundle;//Cache for later use
     return bundle.write({//返回promise，以便下一步then()
       dest: '.tmp/scripts/main.js',
       format: 'iife',
       sourceMap: true,
     });
   }).then(() => {
     browserSync.reload();
   }).catch(err => {
     console.log(err);
   });
});


gulp.task('style',() => {
  const destDir = '.tmp/styles';
  return gulp.src('client/styles/*.scss')
    .pipe($.changed(destDir))
    .pipe($.plumber())
    .pipe($.sourcemaps.init({loadMaps:true}))
    .pipe($.sass({
      includePaths:['bower_components'],//@import的东西的查找位置
      outputStyle:'expanded',
      precision:10
    }).on('error',$.sass.logError))
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest(destDir))
    .pipe(browserSync.stream({once:true}));
});

gulp.task('serve',gulp.parallel('html','style','script',function() {
  browserSync.init({
    server:{
      baseDir: ['.tmp', 'data'],
      directory:true,
      /*
      routes: {
        '/static':'staic',
        '/bower_components':'bower_components',
        '/node_modules':'node_modules'
      }
      */
    },
    port:8080
  });
  gulp.watch('client/styles/**/*.scss',gulp.parallel('style'));
  gulp.watch('client/js/**/*.js',gulp.parallel('script'));
  gulp.watch(['views/**/*.html','data/*.json'],gulp.parallel('html'));
}));

gulp.task('del', (done) => {
 del(['.tmp','dist']).then( paths => {
    console.log('Deleted files:\n',paths.join('\n'));
    done();
  });
});

gulp.task('build', gulp.series('del','html','style','script',() => {
  const destDir = 'dist';
	return gulp.src('.tmp/*.html')
		.pipe($.smoosher({
			ignoreFilesNotFound:true
		}))
		.pipe($.htmlmin({
			collapseWhitespace:true,
			removeComments:true,
			//removeAttributeQuotes:false,
			minifyJS:true,
			minifyCSS:true,
		}))
		.pipe($.size({
			gzip:true,
			showFiles:true,
			showTotal:true
    }))
    //.pipe($.rename(`${finalName}.html`))
		.pipe(gulp.dest(destDir));
}));



gulp.task('publish', gulp.series('build',()=>{
  const managementDir = '../ad-management/complex_pages';
  const onlineDir = '../dev_www/frontend/tpl/marketing';
  const onlineTestDir = '../testing/dev_www/frontend/tpl/marketing';
  const managementStream = gulp.src(`dist/*.html`)
    .pipe(gulp.dest(managementDir));
  const onlineStream = gulp.src(`dist/*.html`)
    .pipe(gulp.dest(onlineDir));
  const onlineTestStream = gulp.src(`dist/*.html`)
  .pipe(gulp.dest(onlineTestDir));
  return merge(managementStream,onlineStream,onlineTestStream);
}));

gulp.task('test', gulp.series('build', () => {
  const testDir = '../NEXT/app/m/marketing';
  return gulp.src(`dist/*.html`)
    .pipe(gulp.dest(testDir));
}));