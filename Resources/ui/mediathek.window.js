var FlipModule = require('de.manumaticx.androidflip'),
    stations = {
	'dlf' : 0,
	'drk' : 1,
	'drw' : 2
},
    Model = require('model/stations'),
    Favs = new (require('controls/favorites.adapter'))();



module.exports = function() {
	//http://jgilfelt.github.io/android-actionbarstylegenerator/#name=dlrmediathek&compat=appcompat&theme=dark&actionbarstyle=solid&texture=0&hairline=0&neutralPressed=1&backColor=6b6a6a%2C100&secondaryColor=6b6a6a%2C100&tabColor=949393%2C100&tertiaryColor=b6b6b6%2C100&accentColor=33B5E5%2C100&cabBackColor=d6d6d6%2C100&cabHighlightColor=949393%2C100
	var locked = false;
	var self = Ti.UI.createWindow();
	self.onitemclickFunc = function(_e) {
		var start = new Date().getTime();
		if (locked == true)
			return;
		locked = true;
		setTimeout(function() {
			locked = false;
		}, 700);
		if (_e.bindId && _e.bindId == 'fav') {
			var item = _e.section.getItemAt(_e.itemIndex);
			var isfav = Favs.toggleFav(JSON.parse(item.properties.itemId));
			item.fav.image = isfav ? '/images/fav.png' : '/images/favadd.png';
			item.fav.opacity = isfav ? 0.8 : 0.5;
			_e.section.updateItemAt(_e.itemIndex, item);
		} else if (_e.bindId && _e.bindId == 'share') {
			console.log('===========================================');
			//return;
			require('ui/sharing.chooser')(function(_type) {
				console.log(_type);
				var message = 'Höre gerade mit der #DRadioMediathekApp „' + JSON.parse(_e.itemId).subtitle + '“';
				console.log(message);
				require('vendor/socialshare')({
					type : _type,
					message : message,
					url : JSON.parse(_e.itemId).url,
					// image : fileToShare.nativePath,
				});
			});
		} else if (_e.bindId && _e.bindId == 'playtrigger') {
			var data = JSON.parse(_e.itemId);
			require('ui/audioplayer.window').createAndStartPlayer({
				color : '#000',
				url : data.url,
				duration : data.duration,
				title : data.title,
				subtitle : data.subtitle,
				author : data.author,
				station : data.station,
				pubdate : data.pubdate
			});
		}
	};
	var pages = [];
	for (var station in Model) {
		pages.push(require('ui/mediathek.page')({
			station : station,
			window : self,
			color : Model[station].color,
			mediathek : Model[station].mediathek,
		}));
	};
	self.FlipViewCollection = FlipModule.createFlipView({
		orientation : FlipModule.ORIENTATION_HORIZONTAL,
		overFlipMode : FlipModule.OVERFLIPMODE_GLOW,
		views : pages,
		currentPage : stations[Ti.App.Properties.getString('LAST_STATION', 'dlf')],
		height : Ti.UI.FILL
	});
	self.onFlippedFunc = function(_e) {
		console.log('≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈  FLIPPED');
		Ti.App.fireEvent('app:station', {
			station : pages[_e.index].station,
			page : 'mediathek'
		});
		pages.forEach(function(page, ndx) {
			if (ndx == _e.index || _e.forced == true) {
				setTimeout(function() {
					page.updateCurrentinTopBox(true);
				}, 500);
				page.updateMediathekList();
			} else
				page.hideCurrent([_e.index]);
		});
	};
	self.onFocusFunc = function() {
		self.FlipViewCollection.peakNext(true);
		Ti.App.fireEvent('app:state', {
			state : true
		});
		Ti.App.fireEvent('app:tab', {
			subtitle : 'Mediathek',
			title : Ti.App.Properties.getString('LAST_STATION'),
			icon : 'drk'
		});
		self.onFlippedFunc({
			index : 0,
			forced : true
		});
		// initial
	};
	self.FlipViewCollection.addEventListener('flipped', self.onFlippedFunc);
	self.addEventListener('focus', self.onFocusFunc);
	self.add(self.FlipViewCollection);
	self.addEventListener('blur', function() {
		Ti.App.fireEvent('app:state', {
			state : false
		});
	});
	return self;
};
