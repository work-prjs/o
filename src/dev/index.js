(
    function(win, storage)
    {
        var doc = document;
        var getStore = function(key)
        {
            return function(data)
            {
                storage.setItem(key, JSON.stringify(data));
                return data;
            }
        }
        var getPathAndHeadersFromPath = function(path)
        {
            var temp = path.split("#");
            var headers;
            if(temp[1]) {
                if(temp[1][0] === "{") {
                    headers = JSON.parse(temp[1]);
                } else {
                    headers = {
                        "Content-Type": temp[1]
                    };
                }
            }
            return {
                path: temp[0],
                headers: headers
            };
        }
        var _translator = function(file, loader)
        {
            return loader(file.path).then(
                function(data)
                {
                    if(file.headers) {
                        data.headers = Object.assign(
                            {},
                            data.headers,
                            file.headers
                        );
                    }
                    return data;
                }
            );
        }
        var translate = function(file, loader, translator, store)
        {
            return translator(file, loader).then(
                function(data)
                {
                    return store(data);
                }
            );
        }
        var getPromisedRequire = function(factory, cache, registry)
        {
            return factory(
                doc,
                cache,
                registry            
            )   
        }
        var getCache = function(cachePrefix)
        {
            return function(__filename, findServices)
            {
                var registry;
                var loadTranslator;
                var services;

                if(findServices !== false) {
                    var temp = __filename.split("/");
                    temp.pop();
                    temp.push("container.js:main");
                    services = temp.join("/");
                    temp = __filename.indexOf("#") !== -1  && __filename.split("#");
                    if(temp.length > 1) {
                        __filename = temp[0];
                        services = temp[1];
                    }
                }
                return function(loader, factory, registryFactory, config)
                {
                    return function(path)
                    {
                        var file = getPathAndHeadersFromPath(path);
                        var cachePath = cachePrefix + file.path;
                        var store = getStore(cachePath);
                        if(services) {
                            if(!loadTranslator) {
                                registry = registryFactory();
                                var require = getPromisedRequire(
                                    factory,
                                    getCache("o-dev+file://")(__filename, false),
                                    registry
                                ).bind(
                                    {
                                        getConfig: function()
                                        {
                                            return config;
                                        }
                                    }
                                );
                                loadTranslator = require("@gardenhq/willow/index.js").then(
                                    function(builder)
                                    {
                                        var registerDynamic = function(path, deps, executingRequire, cb)
                                        {
                                            return registry.set(path, cb);
                                        }
                                        return builder(
                                            require,
                                            registerDynamic
                                        ).then(
                                            function(builder)
                                            {
                                                var args = services.split(":");
                                                // TODO: if builder always gets Promises, should it always set promises?
                                                builder.set(
                                                    "o.dev.delete",
                                                    Promise.resolve(function(key){return Promise.resolve(registry.delete(key))})
                                                );
                                                return builder.build(args[0]).get(args[1] || "main").then(
                                                    function(devtools)
                                                    {
                                                        builder.set(
                                                            "o.dev.import",
                                                            Promise.resolve(
                                                                function(path)
                                                                {
                                                                    return translate(file, loader, translator, store).then(
                                                                        function(data)
                                                                        {
                                                                            return data.content;
                                                                        }
                                                                    );
                                                                }
                                                            )
                                                        );
                                                        var translator = devtools(config);
                                                        return translator;
                                                    }
                                                );
                                            }
                                        );
                                    }
                                );

                            }
                        } else {
                            loadTranslator = Promise.resolve(_translator);
                        }
                        var item = storage.getItem(cachePath);
                        if(item !== null) {
                            return Promise.resolve(JSON.parse(item));
                        }
                        return loadTranslator.then(
                            function(translator)
                            {
                                return translate(file, loader, translator, store);
                            }
                        );
                    };
                }
            }
        }
        proxy(
            getCache("o+file://")
        );
    }
)(window, window.localStorage);