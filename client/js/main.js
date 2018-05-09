const mode = "prod";

if(mode === "prod") {
  console.log("prod");
  dynamicGetHTMLData();
}

function dynamicGetHTMLData() {
  const pWin = window.parent;
  if (pWin && pWin.articleUrl && pWin.articleTitle) {
    console.log('aaaaaaa');
    const article1 = document.getElementById('article1');
    article1.href = pWin.articleUrl;
    article1.innerHTML = pWin.articleTitle;
  }
}