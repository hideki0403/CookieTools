var CookieTools = {
    name: 'CookieTools',
    version: 'v1.1.2',
    config: {
        formatlang: 0
    },
    update: null,

    init: function() {
        // アップデートの確認
        this.checkUpdate()
        
        // メニューのフックを作成
        var origin = eval('Game.UpdateMenu.toString()').split('\n')
    
        origin.splice(origin.length - 1, 0, `
            if(Game.onMenu == 'prefs'){
                CookieTools.injectMenu()
            }
        `)

        eval(`Game.UpdateMenu = ${origin.join('\n')}`)
    },

    register: function() {
        Game.registerMod(this.name, this)
    },

    save: function() {
        return JSON.stringify(this.config)
    },
    
    load: function(data) {
        this.config = JSON.parse(data)
    },

    checkUpdate: async function (self = false) {
        var res = await fetch("https://api.github.com/repos/hideki0403/CookieTools/releases/latest")
        var json = await res.json()

        if(json.message) {
            if(self && json.message.match('API rate limit')) Game.Notify(this.name, 'アップデートの確認に失敗しました<br>時間を開けてからもう一度お試しください', '', true)
            return
        }

        if(json.tag_name === this.version) {
            if(self) Game.Notify(this.name, 'アップデートはありませんでした', '', true)
            return
        }

        this.update = {
            version: json.tag_name,
            releaseNote: json.body.replace(/\n/g, '<br>'),
            link: json.assets[0].browser_download_url
        }

        Game.Notify(this.name, `<b style="color: #00DEFF">CookieToolsのアップデートがあります</b><br>詳しくはオプションの拡張設定をご確認ください`)
    },

    injectMenu: function() {
        var menu = l('menu')
        var element = document.createElement('div')
        element.className = 'framed'
        element.style = 'margin: 4px 48px;'
        element.innerHTML = `
        <div class="block" style="padding:0px;margin:8px 4px;">
            <div class="subsection" style="padding:0px;">
                <div class="title">CookieTools</div>
                    <div class="listing">
                    ${Game.WritePrefButton('format', 'formatButton', '短縮表記 OFF', '短縮表記 ON', 'BeautifyAll();Game.RefreshStore();Game.upgradesToRebuild=1;',1)}
                    <label>(巨大な数の表記を短縮します)</label><br>
                    
                    <a class="smallFancyButton option ${((this.config.formatlang > 0) ? '' : 'off')}" id="langButton" ${Game.clickStr}="CookieTools.langButton()">${this.config.formatlang > 0 ? '単位日本語化 形式' + this.config.formatlang : '単位日本語化 OFF'}</a>
                    <label>(単位を日本語化します)</label><br>
    
                    <a class="smallFancyButton option" id="resetWarn" ${Game.clickStr}="CookieTools.checkUpdate(true)">アップデートを確認</a>
                    <label>CookieToolsのアップデートを確認します</label><br>
                </div>
            </div>
            <div id="CookieToolsUpdate" class="subsection update small" style="${this.update ? '' : 'display: none;'}">
                <div class="title" style="color: #25B0F3">アップデートがあります</div>
                <div class="listing">
                    <div style="margin: 5px 0px;">バージョン: ${this.update?.version}</div>
                    <div style="margin: 15px 0px;">${this.update?.releaseNote}</div>
                    <a class="option" ${Game.clickStr}="Steam.openLink('${this.update?.link}')" target="_brank">最新バージョンをダウンロードする</a>
                    <a class="option" ${Game.clickStr}="send({id:'open folder',loc:'DIR/mods/local/CookieTools'})">CookieToolsフォルダを開く</a>
                    <div style="margin: 15px 0px; color: #E5E101">ダウンロードしたzipの中身をCookieToolsフォルダの中へドラッグアンドドロップ→上書き保存をしてください</div>
                    <a class="option" ${Game.clickStr}="Steam.openLink('https://steamcommunity.com/sharedfiles/filedetails/?id=2594282269')" target="_brank">アップデートガイド</a>
                </div>
            </div>
            <p style="text-align: right; font-size: 12px; color: #999">${this.version}</p>
        </div>
        `
        
        menu.insertBefore(element, menu.lastChild)
    },

    langButton: function() {
        this.config.formatlang = (this.config.formatlang + 1) % 3
        l('langButton').innerHTML= this.config.formatlang > 0 ? '単位日本語化 形式' + this.config.formatlang : '単位日本語化 OFF'
        l('langButton').className = `smallFancyButton option ${(this.config.formatlang > 0 ? '' : 'off')}`
        BeautifyAll()
        Game.RefreshStore()
        Game.upgradesToRebuild = 1
        PlaySound('snd/tick.mp3')
    }
}

function formatEveryFourthPower(notations) {
    return function (value) {
        var base = 1,
        notationValue = ''
        
        if (!isFinite(value)) return '無限大'
        if (value >= 10000) {
            value /= 10000
            
            while(Math.round(value) >= 10000) {
                value /= 10000
                base++
            }
            
            if (base >= notations.length) {
                return '無限大'
            } else {
                notationValue = notations[base]
            }
        }
        
        return (Math.round(value * 10000) / 10000) + notationValue
    }
}

function formatEveryFourthPower2() {
    return function (value) {
        var baseShort = 0,
        baseLong = 0,
        notationValue = '',
        notationValue2 = ''
        
        if (!isFinite(value)) return '無限大'
        if (value >= 10000) {
            const binbara = 10 ** 56
            while (value >= binbara)
            {
                value /= binbara
                baseLong++
            }
            if (baseLong > formatJpLong.length) return '無限大'
            if (value >= 10000) {
                while (Math.round(value) >= 10000) {
                    value /= 10000
                    baseShort++
                }
                
                notationValue = formatJpShort[baseShort]
                notationValue2 = formatJpShort[baseShort - 1] + formatJpLong[baseLong]
            } else {
                notationValue = formatJpLong[baseLong]
                notationValue2 = formatJpShort[formatJpShort.length - 1] + formatJpLong[baseLong - 1]
            }
            value = Math.round(value * 10000)
            return Math.floor(value / 10000) + notationValue + (value % 10000 > 0 ? (value % 10000) + notationValue2 : '')
        } else {
            return value
        }
    }
}

var formatJpShort = ['','万','億','兆','京','垓','秭','穣','溝','澗','正','載','極','恒河沙']
var formatJpLong = ['']
var suffixes = ['頻波羅','矜羯羅','阿伽羅']
var formatJp = formatJpShort.concat()
for (var i = 0; i < suffixes.length; i++) {
    var j = formatJp.length
    for (var ii = 0; ii < j; ii++) {
        formatJp.push(formatJp[ii] + suffixes[i])
    }
    var j = formatJpLong.length
    for (var ii = 0; ii < j; ii++) {
        formatJpLong.push(formatJpLong[ii] + suffixes[i])
    }
}


var numberFormatters= [
    formatEveryThirdPower(formatShort),
    formatEveryThirdPower(formatLong),
    rawFormatter,
    formatEveryFourthPower(formatJp),
    formatEveryFourthPower2()
]

Beautify = (val,floats) => {
    var negative = (val < 0)
    var decimal = ''
    var fixed = val.toFixed(floats)
    if (Math.abs(val) < 1000 && floats > 0 && Math.floor(fixed) != fixed) decimal = '.' + (fixed.toString()).split('.')[1]
    val = Math.floor(Math.abs(val))
    if (floats > 0 && fixed == val + 1) val++
    var formatter = numberFormatters[Game.prefs.format ? 2 : (CookieTools.config.formatlang > 0 ? 2 + CookieTools.config.formatlang : 1)]
    var output = (val.toString().indexOf('e+') != -1 && Game.prefs.format == 1) ? val.toPrecision(3).toString() : formatter(val).toString()
    if (Game.prefs.format || !CookieTools.config.formatlang) {
        output = output.replace(/B(?=(d{3})+(?!d))/g, ',')
    } else {
        output = output.replace(/^(d)(d{3})/, '$1,$2')
    }
    if (output=='0') negative = false
    return negative ? '-' + output : output + decimal
}

for (func of Object.getOwnPropertyNames(CookieTools).filter(m => typeof CookieTools[m] === 'function')) {
    CookieTools[func] = CookieTools[func].bind(CookieTools)
}

CookieTools.register()