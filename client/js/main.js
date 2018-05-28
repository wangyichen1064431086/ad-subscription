/*
const mode = "prod";

if(mode === "prod") {
  console.log("prod");
  dynamicGetHTMLData();
} else {

}

function dynamicGetHTMLData() {
  const pWin = window.parent;
  if (!pWin) {
    return;
  }
  if (pWin.topTitle) {
    document.querySelector('.top-title').innerHTML = pWin.topTitle;
  }
  if (pWin.headArticleTitle && pWin.headArticleUrl && pWin.headArticleImg) {
    const headArticle = document.querySelector('.head-article');
    const aElem = headArticle.querySelector('a');
    aElem.href = pWin.headArticleUrl;
    const imgElem = headArticle.querySelector('img');
    imgElem.src = pWin.headArticleImg;
    const pElem = headArticle.querySelector('p');
    pElem.innerHTML = pWin.headArticleTitle;
  }

  const articleLists = Array.from(document.querySelectorAll('.article-list .article'));
  const articleData = [];

  if (pWin.listArticle1Tag && pWin.listArticle1Title && pWin.listArticle1Url) {
    articleData.push({
      tag: pWin.listArticle1Tag,
      title: pWin.listArticle1Title,
      url: pWin.listArticle1Url
    });
  }
  if (pWin.listArticle2Tag && pWin.listArticle2Title && pWin.listArticle2Url) {
    articleData.push({
      tag: pWin.listArticle2Tag,
      title: pWin.listArticle2Title,
      url: pWin.listArticle2Url
    });
  }
  if (pWin.listArticle3Tag && pWin.listArticle3Title && pWin.listArticle3Url) {
    articleData.push({
      tag: pWin.listArticle3Tag,
      title: pWin.listArticle3Title,
      url: pWin.listArticle3Url
    });
  }

  articleLists.forEach((item, index) => {
    const data = articleData.shift();
    const {tag, title, url} = data;
    const tagElem = item.querySelector('.tag');
    tagElem.innerHTML = tag;
    const aElem = item.querySelector('.title a');
    aElem.href = url;
    aElem.innerHTML = title;
  });
}
*/
if (window.parent && window.parent.parent && window.parent.parent.ga) {
  //console.log('track ga for ad subscription');
  const ga = window.parent.parent.ga;
  const adTitle = document.getElementsByTagName('title')[0].innerHTML;
  const category = `Subscription HouseAd: ${adTitle}`;
  const action = 'click';

  const headArticle = document.querySelector('.head-article a');
  const labelForHeadArticle = 'Head Article';
  //console.log(headArticle);
  headArticle.onclick = function() {
    ga('send', 'event', category, action, labelForHeadArticle);
  }

  const subBtn = document.querySelector('.payinfo a');
  const labelForSubBtn = 'Subscription Button';
  subBtn.onclick = function() {
    ga('send', 'event', category, action, labelForSubBtn);
  }

  const articleLists = Array.from(document.querySelectorAll('.article-list .article a'));
  articleLists.forEach((elem, index) => {
    (function() {
       elem.addEventListener('click', function(){
        const labelForListArticle = `Article: ${index+1}`;
        ga('send', 'event', category, action, labelForListArticle);
       })
    })(index);
  });
}