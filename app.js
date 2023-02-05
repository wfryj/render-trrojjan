const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
var exec = require("child_process").exec;
const os = require("os");
const { createProxyMiddleware } = require("http-proxy-middleware");
var request = require("request");
const fetch = require("node-fetch");

app.get("/", (req, res) => {
  res.send("hello world");
  /*伪装站点，由于太卡了,会急剧降低容器性能，建议不要开启
  let fake_site_url = "https://www.qidian.com/"
  fetch(fake_site_url).then((res) => res.text()).then((html) => res.send(html));
  */
});

app.get("/status", (req, res) => {
  let cmdStr = "ps -ef";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.type("html").send("<pre>命令行执行错误：\n" + err + "</pre>");
    } else {
      res.type("html").send("<pre>命令行执行结果：\n" + stdout + "</pre>");
    }
  });
});

app.get("/start", (req, res) => {
  let cmdStr = "./web -c ./config.yaml >/dev/null 2>&1 &";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.send("命令行执行错误：" + err);
    } else {
      res.send("命令行执行结果：启动成功!");
    }
  });
});

app.get("/info", (req, res) => {
  let cmdStr = "cat /etc/*release | grep -E ^NAME";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.send("命令行执行错误：" + err);
    } else {
      res.send(
        "命令行执行结果：\n" +
          "Linux System:" +
          stdout +
          "\nRAM:" +
          os.totalmem() / 1000 / 1000 +
          "MB"
      );
    }
  });
});

app.use(
  "/api",
  createProxyMiddleware({
    target: "http://127.0.0.1:8080/", // 需要跨域处理的请求地址
    changeOrigin: true, // 默认false，是否需要改变原始主机头为目标URL
    ws: true, // 是否代理websockets
    pathRewrite: {
      // 请求中去除/api
      "^/api": "/qwe",
    },
    onProxyReq: function onProxyReq(proxyReq, req, res) {
      //console.log("-->  ",req.method,req.baseUrl,"->",proxyReq.host + proxyReq.path);
    },
  })
);

app.use(
  "/test",
  createProxyMiddleware({
    target: "http://127.0.0.1:8081/", // 需要跨域处理的请求地址
    changeOrigin: true, // 默认false，是否需要改变原始主机头为目标URL
    ws: true, // 是否代理websockets
    pathRewrite: {
      // 请求中去除/test
      "^/test": "/",
    },
    onProxyReq: function onProxyReq(proxyReq, req, res) {
      //console.log("-->  ",req.method,req.baseUrl,"->",proxyReq.host + proxyReq.path);
    },
  })
);

/* keepalive  begin */
function keepalive() {
  // 1.请求主页，保持唤醒
  let render_app_url = "https://nodejs-express-test-7lve.onrender.com";
  request(render_app_url, function (error, response, body) {
    if (!error) {
      console.log("主页发包成功！");
      console.log("响应报文:", body);
    } else console.log("请求错误: " + error);
  });

  //2. 本地进程检测,保活web
  exec("ps -ef", function (err, stdout, stderr) {
    if (err) {
      console.log("保活web-本地进程检测-命令行执行失败:" + err);
    } else {
      if (stdout.includes("./web -c ./config.yaml"))
        console.log("保活web-本地进程检测-web正在运行");
      //命令调起web
      else startWeb();
    }
  });

  //3.本地进程检测, 保活test
  exec("ps -ef", function (err, stdout, stderr) {
    if (err) {
      console.log("保活web-本地进程检测-命令行执行失败:" + err);
    } else {
      if (stdout.includes("./test -p 8081 bash"))
        console.log("保活test-本地进程检测-test正在运行");
      //命令调起web
      else startTest();
    }
  });
}

//保活频率设置为30秒
setInterval(keepalive, 30 * 1000);
/* keepalive  end */

function startWeb() {
  let startWebCMD = "chmod +x ./web && ./web -c ./config.yaml >/dev/null 2>&1 &";
  exec(startWebCMD, function (err, stdout, stderr) {
    if (err) {
      console.log("启动web-失败:" + err);
    } else {
      console.log("启动web成功!");
    }
  });
}

function startTest() {
  let startTestCMD = "chmod +x ./test && ./test -p 8081 bash >/dev/null 2>&1 &";
  exec(startTestCMD, function (err, stdout, stderr) {
    if (err) {
      console.log("启动test-失败:" + err);
    } else {
      console.log("启动test成功!");
    }
  });
}

/* init  begin */
startWeb();
startTest();
/* init  end */

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
