! function() {
	//require('dk.napp.downloadmanager');
	var introWindow = require('ui/intro.window')();
	introWindow.addEventListener('open',function(){
		require('ui/main.tabgroup')();
	});
	console.log('intro open');
	introWindow.open();
}();
