---
layout: post
title:  "Do It Realtime"
date:   2016-05-01 14:11:39 +0700
categories: blog
---
Very long time without a new post.

I have been busy with my job and last week I took part in hackathon. It is really nice experience.

So, this time I am gonna write about [websocket](http://tools.ietf.org/html/rfc6455). I am not gonna explain websocket itself, but I want to share the fun I got when develop websocket with golang.

You will need this library to play with websocket.

``` sh
    $ go get golang.org/x/net/websocket
```

The server is as simple as this

``` go
package main

import (
    "html/template"
    "log"
    "net/http"

    "golang.org/x/net/websocket"
)

func wsHandler(ws *websocket.Conn) {
    if err := websocket.Message.Send(ws, "Hey, you pushed me!"); err != nil {
        log.Println(err)
    }
}

func indexHanlder(w http.ResponseWriter, r *http.Request) {
    t, _ := template.ParseFiles("static/index.html")
    t.Execute(w, nil)
}

func main() {
    http.HandleFunc("/", indexHanlder)
    http.Handle("/ws", websocket.Handler(wsHandler))

    if err := http.ListenAndServe(":1234", nil); err != nil {
        log.Fatal("ListenAndServe:", err)
    }
}
```

And for the client

``` html
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<meta name="robots" content="index, follow">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>GoSock</title>
	</head>
	<body>
        <script type="text/javascript">
        window.onload = function() {
            var sock = new WebSocket("ws://127.0.0.1:1234/ws");
            sock.onmessage = function(e) {
                console.log("message received: " + e.data);
                document.getElementById("text").innerHTML = e.data;
            }
        };
    </script>
        <p id="text"></p>
	</body>
</html>
```

Which is shown in the screenshot below:
![GoSock]({{ site.baseurl }}/images/gosock.png)

It is only handled one way pushed message. If you want to handle two way communication. For example, create a chat app. You can add call this function to receive message from client.

``` go
var msg string
if err := websocket.Message.Receive(ws, &msg); err != nil {
    log.Println(err)
}

log.Println(msg)
```
