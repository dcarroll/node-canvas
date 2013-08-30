module.exports = {
	getStaticRequest : function() {
		var fs = require('fs');
		try {
			var fData = fs.readFileSync("sr-response.json")
			return fData;
		} catch(err) {
			console.log("Read error: " + err);
			return err;
		}
	}
}
