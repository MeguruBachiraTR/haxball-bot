const puppeteer = require('puppeteer');

async function startBot() {
    console.log("Sunucu ici gizli tarayici baslatiliyor...");
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    await page.goto('https://www.haxball.com/headless', { waitUntil: 'networkidle2' });

    page.on('console', msg => {
        if (msg.text().startsWith("ODA_LINKI:")) {
            console.log("\n====================================");
            console.log("ODA LINKIN HAZIR: " + msg.text().replace("ODA_LINKI:", ""));
            console.log("====================================\n");
        } else {
            console.log("Bot Ekrani: ", msg.text());
        }
    });

    console.log("Haxball sayfasi acildi, rank sistemi yukleniyor...");

    await page.evaluate(() => {
        var room = HBInit({ 
            roomName: "Rank Sistemli Oda 7/24", 
            maxPlayers: 16, 
            public: true,
            token: "thr1.AAAAAGoZ5RCN9mvp21wglg.nKFa9KBTwE0",
            config: {
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" },
                    { urls: "stun:stun1.l.google.com:19302" },
                    { urls: "stun:stun2.l.google.com:19302" },
                    { urls: "stun:stun3.l.google.com:19302" }
                ]
            }
        });

        var playersData = {};

        if (localStorage.getItem('haxRankData')) {
            playersData = JSON.parse(localStorage.getItem('haxRankData'));
        }

        function saveData() {
            localStorage.setItem('haxRankData', JSON.stringify(playersData));
        }

        function getRankName(xp) {
            if (xp < 101) return "[Bronz]";
            if (xp < 301) return "[Gumus]";
            if (xp < 601) return "[Altin]";
            if (xp < 1001) return "[Platin]";
            return "[Elmas]";
        }

        function getAvatar(xp) {
            if (xp < 101) return "BR";
            if (xp < 301) return "GM";
            if (xp < 601) return "AL";
            if (xp < 1001) return "PL";
            return "EL";
        }

        room.onPlayerJoin = function(player) {
            if (!playersData[player.auth]) {
                playersData[player.auth] = { xp: 0 }; 
            }
            if (player.name === "MeguruBachiraTR") {
                room.setPlayerAdmin(player.id, true);
            }
            updatePlayerRank(player);
        };

        room.onPlayerAdminChange = function(changedPlayer, byPlayer) {
            updatePlayerRank(changedPlayer);
        };

        function updatePlayerRank(player) {
            if (player.admin) {
                room.setPlayerAvatar(player.id, "AD");
            } else {
                var xp = playersData[player.auth] ? playersData[player.auth].xp : 0;
                room.setPlayerAvatar(player.id, getAvatar(xp));
            }
        }

        room.onPlayerChat = function(player, message) {
            if (player.admin) {
                room.sendAnnouncement("[Admin] " + player.name + ": " + message, null, 0xFF0000, "bold", 1);
            } else {
                var xp = playersData[player.auth] ? playersData[player.auth].xp : 0;
                var rank = getRankName(xp);
                room.sendAnnouncement(rank + " " + player.name + ": " + message, null, 0xFFFFFF, "normal", 1);
            }
            return false;
        };

        room.onTeamVictory = function(scores) {
            var winningTeam = scores.red > scores.blue ? 1 : 2;
            var players = room.getPlayerList();
            for (var i = 0; i < players.length; i++) {
                var p = players[i];
                if (p.team === winningTeam && playersData[p.auth]) {
                    playersData[p.auth].xp += 15;
                }
                updatePlayerRank(p);
            }
            saveData();
        };

        room.onTeamGoal = function(team) {
            var players = room.getPlayerList();
            for (var i = 0; i < players.length; i++) {
                var p = players[i];
                if (p.team === team && playersData[p.auth]) {
                    playersData[p.auth].xp += 5;
                }
                updatePlayerRank(p);
            }
            saveData();
        };

        room.onRoomLink = function(link) {
            console.log("ODA_LINKI:" + link);
        };
    });
}

startBot().catch(err => console.error("Bot baslatilamadi:", err));
