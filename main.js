cookieTools = {
    version: 'v1.1.0',
    config: {
        formatlang: 0
    },
    update: null
}

Game.registerMod('CookieTools', {
    init: () => {
        // アップデートの確認
        checkUpdate()

        // Game.UpdateMenuのフックを作成
        var origin = Game.UpdateMenu
        
        Game.UpdateMenu = () => {
            origin.apply()
            if (Game.onMenu !== 'prefs') return
            
            var menu = l('menu')
            var element = document.createElement('div')
            element.className = 'framed'
            element.style = 'margin: 4px 48px;'
            element.innerHTML = `
            <div class="block" style="padding:0px;margin:8px 4px;">
                <div class="subsection" style="padding:0px;">
                    <div class="title">拡張設定</div>
                        <div class="listing">
                        ${Game.WriteButton('format', 'formatButton', '短縮表記 OFF', '短縮表記 ON', 'BeautifyAll();Game.RefreshStore();Game.upgradesToRebuild=1;',1)}
                        <label>(巨大な数の表記を短縮します)</label><br>
                        
                        <a class="smallFancyButton option ${((cookieTools.config.formatlang > 0) ? '' : 'off')}" id="langButton" ${Game.clickStr}="langButton()">${cookieTools.config.formatlang > 0 ? '単位日本語化 形式' + cookieTools.config.formatlang : '単位日本語化 OFF'}</a>
                        <label>(単位を日本語化します)</label><br>
                        
                        <a class="smallFancyButton option" id="resetWarn" ${Game.clickStr}="resetWarn()">セーブデータを修正</a>
                        <label>(ゲームを閉じたりリロードしたり出来なくなる不具合の原因を修正します)</label><br>

                        <a class="smallFancyButton option" id="resetWarn" ${Game.clickStr}="checkUpdate(true)">アップデートを確認</a>
                        <label>CookieToolsのアップデートを確認します</label><br>
                    </div>
                </div>
                <div id="cookieToolsUpdate" class="subsection update small" style="${cookieTools.update ? '' : 'display: none;'}">
                    <div class="title" style="color: #25B0F3">アップデートがあります</div>
                    <div class="listing">
                        <div style="margin: 5px 0px;">バージョン: ${cookieTools.update?.version}</div>
                        <div style="margin: 5px 0px;">${cookieTools.update?.releaseNote}</div>
                        <a class="option" ${Game.clickStr}="Steam.openLink('${cookieTools.update?.link}')" target="_brank">最新バージョンをダウンロードする</a>
                        <a class="option" ${Game.clickStr}="send({id:'open folder',loc:'DIR/mods/local/CookieTools'})">CookieToolsフォルダを開く</a>
                        <div style="margin: 5px 0px; color: #E5E101">ダウンロードしたzipの中身をCookieToolsフォルダの中へドラッグアンドドロップ→上書き保存をしてください</div>
                    </div>
                </div>
                <p style="text-align: right; font-size: 12px; color: #999">CookieTools</p>
            </div>
            `
            
            menu.insertBefore(element, menu.lastChild)
        }
    },
    
    save: () => {
        return JSON.stringify(cookieTools.config)
    },
    
    load: (data) => {
        cookieTools.config = JSON.parse(data)
    }
})

async function checkUpdate(self = false) {
    var res = await fetch("https://api.github.com/repos/hideki0403/CookieTools/releases/latest")
    var json = await res.json()

    if(json.tag_name === cookieTools.version) {
        if(self) Game.Notify('CookieTools', 'アップデートはありませんでした', '', true)
        return
    }

    cookieTools.update = {
        version: json.tag_name,
        releaseNote: json.body.replace(/\n/g, '<br>'),
        link: json.assets[0].browser_download_url
    }

    Game.Notify('CookieTools', `<b style="color: #00DEFF">CookieToolsのアップデートがあります</b><br>詳しくはオプションの拡張設定をご確認ください`)
}

function resetWarn() {
    Game.prefs.warn = 0
    Game.WriteSave()
    Game.Notify('CookieTools', 'セーブデータの修正が完了しました')
}

function langButton() {
    cookieTools.config.formatlang = (cookieTools.config.formatlang + 1) % 3
    l('langButton').innerHTML= cookieTools.config.formatlang > 0 ? '単位日本語化 形式' + cookieTools.config.formatlang : '単位日本語化 OFF'
    l('langButton').className = `smallFancyButton option ${(cookieTools.config.formatlang > 0 ? '' : 'off')}`
    BeautifyAll()
    Game.RefreshStore()
    Game.upgradesToRebuild = 1
    PlaySound('snd/tick.mp3')
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
    var formatter = numberFormatters[Game.prefs.format ? 2 : (cookieTools.config.formatlang > 0 ? 2 + cookieTools.config.formatlang : 1)]
    var output = (val.toString().indexOf('e+') != -1 && Game.prefs.format == 1) ? val.toPrecision(3).toString() : formatter(val).toString()
    if (Game.prefs.format || !cookieTools.config.formatlang) {
        output = output.replace(/B(?=(d{3})+(?!d))/g, ',')
    } else {
        output = output.replace(/^(d)(d{3})/, '$1,$2')
    }
    if (output=='0') negative = false
    return negative ? '-' + output : output + decimal
}