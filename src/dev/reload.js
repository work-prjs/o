module.exports = function(url, clear, flash, shouldReload, win, doc)
{
    win = win || window;
    doc = doc || document;
    var addHost = function(s)
    {
        var l = win.location;
        return ((l.protocol === "https:") ? "wss://" : "ws://") + l.host + s;
    }
    url = url || "/_index.ws";
    url = url.indexOf("://") === -1 ? addHost(url) : url;
    shouldReload = shouldReload || function(){ return true; }

    return function()
    {
        var connect = function()
        {
            var ws = new WebSocket(url);
            Object.assign(
                ws,
                {
                    onmessage: function(e)
                    {
                        var extension = e.data.split(".").pop();
                        var message = "Edited file:///" + e.data + ".";
                        flash.add(message);
                        clear(e.data).then(
                            function(reload)
                            {
                                if(shouldReload(e.data, extension)) {
                                    message += "File reloaded via full refresh";
                                    // flash.add(message);
                                    ws.onclose = function()
                                    {
                                        reload();
                                    }
                                    ws.close();
                                } else {
                                    message += " File reloaded via inline refresh";
                                    console.debug(message);
                                }
                            }
                        );
                    },
                    onclose: function(e)
                    {
                        connect();
                    }
                }
            );
            win.onbeforeunload = function()
            {
                ws.onclose = function () {};
                ws.close()
            };

        }
        connect();
    }
}