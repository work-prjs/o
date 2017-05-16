(
	function(load)
	{
		var cdn = "https://unpkg.com/";
		load.then(
			function(System)
			{
				Promise.all(
					[
					    cdn + "react@15.5.4/index.js",
					    cdn + "react-dom@15.5.4/index.js"
					].map(
					    function(item)
					    {
                            return System.import(item);
					    }
					)
				).then(
					function(modules)
					{
						var $root = document.createElement("div");
						document.body.appendChild($root);
						var React = modules[0];
						var ReactDOM = modules[1];
						ReactDOM.render(
							React.DOM.h1(
							    null,
							    "Hello World!"
							),
							$root 
						)
					}
				);

			}
		).catch(
			function(e)
			{
				throw e;
			}
		);
	}
)(o(function(o){return o(document)}))

