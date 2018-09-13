RenJS.customContent = {
	//put here your own functions

	helloworld: function (params) {
		console.log("helloworld function");
		console.log(params.param1 + " " +params.param2);
		RenJS.resolve();
	},
	inputvar: function(paramstring) {
		var params = paramstring.split("|");
		var value = prompt(params[1], params[2]);
		console.log(value);
		console.log(params[0]);
		RenJS.logicManager.setVar(params[0], value);
		RenJS.resolve();
	}
}

