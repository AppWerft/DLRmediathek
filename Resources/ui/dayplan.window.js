var Model = require('model/stations'),
    RSS = new (require('controls/rss.adapter'))(),
    Moment = require('vendor/moment');

module.exports = function(station) {
    if (!station)
        return;

    function updateListFunc(_RSSitems) {
        var length = _RSSitems.items.length;
        var laststart = Moment().startOf('day');
        var ndx = 0;
        for ( i = 0; i < length; i++) {
            var item = _RSSitems.items[i];
            if (i == 1) {
                _RSSitems.items[0].duration = Moment(item.pubDate).diff(Moment().startOf('day'), 'seconds');
                _RSSitems.items[1].duration = Moment(item.pubDate).diff(laststart, 'seconds');
                _RSSitems.items[0].endtime = Moment(item.pubDate);
                _RSSitems.items[1].endtime = Moment(_RSSitems.items[2].pubDate);
            } else if (i == length - 1) {
                _RSSitems.items[i].duration = Moment().startOf('day').add(1, 'day').diff(Moment(item.pubDate), 'seconds');
                _RSSitems.items[i].endtime = Moment().startOf('day').add(1, 'day');
            } else {
                _RSSitems.items[i].duration = Moment(item.pubDate).diff(laststart, 'seconds');
                _RSSitems.items[i].endtime = Moment(_RSSitems.items[i + 1].pubDate);
            }
            laststart = Moment(item.pubDate);
            item.isonair = (Moment().isBetween(item.pubDate, item.endtime)) ? true : false;
            if (!item.endtime.isAfter(Moment()))
                ndx++;
        }
        _RSSitems.items.forEach(function(item) {
            var duration = Moment(item.pubDate).diff(laststart, 'seconds');
            var endtime = Moment(item.pubDate).add(duration, 'seconds');
            console.log(item.duration);
            if ( typeof item.link != 'string')
                item.link = null;
            items.push({
                properties : {
                    accessoryType : (item.link) ? Ti.UI.LIST_ACCESSORY_TYPE_DISCLOSURE : Ti.UI.LIST_ACCESSORY_TYPE_NONE,
                    itemId : (item.link) ? JSON.stringify(item) : undefined,
                },
                equalizer : {
                    height : 0
                },
                onair : {
                    visible : (item.isonair) ? true : false,
                    height : (item.isonair) ? 40 : 5,
                },
                start : {
                    text : Moment(item.pubDate).format('HH:mm'),
                    color : (item.endtime.isAfter(Moment())) ? '#333' : '#bbb'
                },
                description : {
                    html : ( typeof item.description == 'string') ? item.description : '',
                    height : ( typeof item.description == 'string') ? Ti.UI.SIZE : 0,
                    opacity : (item.endtime.isAfter(Moment())) ? 1 : 0.7
                },
                title : {
                    text : item.title,
                    color : model.color,
                    opacity : (item.endtime.isAfter(Moment())) ? 1 : 0.7
                }
            });

        });
        self.list.sections[0].setItems(items);
        self.list.scrollToItem(0, ndx);
    }

    var model = require('model/stations')[station];
    var self = require('ui/generic.window')({
        title : 'Deutschlandradio',
        subtitle : 'Heutige Programmübersicht',
        station : station
    });
    self.list = Ti.UI.createListView({
        height : Ti.UI.FILL,
        backgroundColor : station,
        templates : {
            'schema' : require('TEMPLATES').schema,
        },
        defaultItemTemplate : 'schema',
        sections : [Ti.UI.createListSection({})]
    });
    var items = [];

    RSS.getRSS({
        url : model.rss,
        done : updateListFunc
    });
    self.list.addEventListener('itemclick', function(_e) {
        if (_e.bindId && _e.bindId == 'onair') {
            var item = _e.section.getItemAt(_e.itemIndex);
            item.equalizer.url = '/images/equalizer.gif';
            item.equalizer.height = 36;
            console.log(item.equalizer);
            _e.section.updateItemAt(_e.itemIndex, item);
        } else {
            var item = JSON.parse(_e.itemId);
            var win = require('ui/generic.window')({
                subtitle : item.title,
                title : 'Deutschlandradio',
                station : station
            });
            var web = Ti.UI.createWebView({
                borderRadius : 1,
                enableZoomControls : false,
                url : item.link
            });
            win.add(web);
            win.open();
        }

    });
    self.add(self.list);
    self.open();
};
