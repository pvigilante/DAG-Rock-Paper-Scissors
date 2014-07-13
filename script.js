(function($){
    var $options = $('[role=options]'),
        $record = $('[role=record]'),
        $playertitle = $('#player'),
        $startscreen = $('#start'),
        $gamescreen = $('#game'),
        choice, choice0, choice1, choice2,
        turn = true,
        attempt = 0,
        record = '', 
        code,code2,player,
        gamelength = [],
        gametype = [],
        players,win,
        options = ['Rock', 'Paper', 'Scissors', 'Lizard', 'Spock'];
    gamelength[1] = '1 out of 1';
    gamelength[2] = '2 out of 3';
    gamelength[3] = '3 out of 4';
    gamelength[4] = '4 out of 6';
    gamelength[5] = '5 out of 9';
    gamelength[6] = '6 out of 10';
    gametype[1] = 'Rock, Paper, Scissors';
    gametype[2] = 'Rock, Paper, Scissors, Lizard, Spock';
 
//Add functionality for counting a value in an array
Array.prototype.count = function(value) {
  var counter = 0;
  for(var i=0;i<this.length;i++) {
    if (this[i] == value) counter++;
  }
  return counter;
};
    ////////////////////////////////////////////////
    //
    //  FUNCTION: QUERY STRING
    //
    ////////////////////////////////////////////////
    var QueryString = function () {
      // This function is anonymous, is executed immediately and 
      // the return value is assigned to QueryString!
        var query_string = {};
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
            // If first entry with this name
            if (typeof query_string[pair[0]] == "undefined") {
                query_string[pair[0]] = pair[1];
                // If second entry with this name
            } else if (typeof query_string[pair[0]] == "string") {
                var arr = [ query_string[pair[0]], pair[1] ];
                query_string[pair[0]] = arr;
                // If third or later entry with this name
            } else {
                query_string[pair[0]].push(pair[1]);
            }
        } 
        return query_string;
    } ();
    
    ////////////////////////////////////////////////
    //
    //  INIT: CHECK IF CODE IS SET
    //
    ////////////////////////////////////////////////
    if(QueryString.code !== undefined){
        ////////////////////////////////////////////////
        //  OPEN EXISTING GAME
        ////////////////////////////////////////////////
        $startscreen.hide();
        $gamescreen.show();
        // Get current game info from database
        code = QueryString.code;
        player = code.slice(-1);
        if(player == 'a'){player = 1}
        else if(player == 'b'){player = 2}
        else if(player == 'c'){player = 3}
        else if(player == 'd'){player = 4}
        getStats(code, player);
    } else {
        ////////////////////////////////////////////////
        //  START NEW GAME
        ////////////////////////////////////////////////
        $startscreen.show();
        $gamescreen.hide();
        // On New game click
        
    }
    
    $(document).on('click', '[role=startgame]', function(){
            // create new codes and send to database
            //$gamescreen.html('');
            if(QueryString.code != undefined){
                continueGame(1,2,2,QueryString.code,player)
            }else {
               newGame(1,2,2); 
            }
            
        });
    ////////////////////////////////////////////////
    //
    //  ON: SELECT CHOICE
    //
    ////////////////////////////////////////////////
    $options.on('click','[role=choice]',function(){
        choice = $(this).data('choice');
        
        $options.css({'opacity':0.5});
        makeChoice(player,choice, code); 
    });
    
    
    ////////////////////////////////////////////////
    //
    //  FUNCTION: NEW GAME
    //
    ////////////////////////////////////////////////
    function newGame(gameType, gameLength, Players){
        //GameType {1:r-p-s, 2:r-p-s-l-s}
        //GameLength { 1:2-3, 2:3-4, 3:4-6, 4:5-9, 5:6-10}
        //Players {2, 3, 4}
        var ws = new EventSource('process.php?action=newcodes&gametype='+gameType+'&gamelength='+gameLength+'&players='+Players);
        ws.onmessage = function(e) {
            var data = JSON.parse(e.data);
            //console.log(data);   
            code = data.code; 
            player = data.player; 
            ws.close();        
            window.history.pushState(null, null, '?code='+code);
            //show player 2 code
            getStats(code, player);
            
            $('#gamestats').fadeIn(500);
        };
        ws.onerror = function(e){
            console.log(e);
        };
    }
    
    ////////////////////////////////////////////////
    //
    //  FUNCTION: CONTINUE GAME
    //
    ////////////////////////////////////////////////
    function continueGame(gameType, gameLength, Players, Code, Player){
        //GameType {1:r-p-s, 2:r-p-s-l-s}
        //GameLength { 1:2-3, 2:3-4, 3:4-6, 4:5-9, 5:6-10}
        //Players {2, 3, 4}
        var ws = new EventSource('process.php?action=newgame&gametype='+gameType+'&gamelength='+gameLength+'&players='+Players+'&code='+Code+'&player='+Player);
        ws.onmessage = function(e) {
            var data = JSON.parse(e.data);  
            ws.close();
            //show player 2 code
            getStats(code, player);
            $('#gamestats').fadeIn(500);
        };
        ws.onerror = function(e){
            console.log(e);
        };
    }
    
    ////////////////////////////////////////////////
    //
    //  FUNCTION: GET STATS
    //
    ////////////////////////////////////////////////
    function getStats(Code, Player){
        //GameType {1:r-p-s, 2:r-p-s-l-s}
        //GameLength { 1:2-3, 2:3-4, 3:4-6, 4:5-9, 5:6-10}
        //Players {2, 3, 4}
        var ws = new EventSource('process.php?action=status&code='+Code+'&player='+Player);
        ws.onmessage = function(e) {
            $startscreen.slideUp();
            $gamescreen.slideDown();
            var data = JSON.parse(e.data);
            //console.log(data.choice0 + ' ' + data.choice1 + ' ' + data.round);
        if(round == data.round && choice0 != data.choice0){
             $('[role=message]').text('Draw').fadeIn(500);
        }
        if (record != data.record){
            gameLength = data.gamelength;
            
            $('#round').text('Round '+data.round);
            $('#gamelength').text('Best '+gamelength[gameLength]);
            $('[role=record]').html('');
            
            
            
            var winners = [];
            for(var i = 0; i <= gameLength; i++){
                var sel = 'winner'+i;
                if(data[sel]){
                    
                    win = player!=data[sel][0]?2:1;
                    $('[role=record]').append('<li data-winner="'+data[sel][1]+data[sel][2]+'" data-played="'+win+'">'+data[sel]+'</li>');
                    winners.push(data[sel][0]);
                    
                }
            }
            player = data.player;
            console.log(player + ' ' + win);
            if(data.round > round && win == 1){
                $('[role=message]').text('Win').fadeIn(500);
                console.log('win');
            }
            else if(data.round > round && win == 2){
                $('[role=message]').text('Loose').fadeIn(500);
                console.log('loose');
            }
            
            
            
            record = data.record;
            code = data.code;    
            code2 = data.code2;  
            
            players = data.players;   
            gameType = data.gametype;
            round = data.round;
            
            choice0 = data.choice0;
            choice1 = data.choice1;
            
           
            
           
            
            
            
            if(data.turn == 'false' && data.round != 'Game Over'){
                $('[role=message]').text('Waiting for Player 2').fadeIn(500);
                $('[role=options] [role=choice]').attr('disabled', 'disabled');  
            }
            
            
            
            if(data.choice0 != "-" && data.choice1 != "-"){
                $('[role=message]').fadeOut(500);
                if(data.round != 'Game Over') {
                    $('[role=options] [role=choice]').attr('disabled', false);
                    $options.css({'opacity':1});
                }
                    
            } else if(data.choice0 != "-"){
                $('[role=record]').append('<li>?</li>');
            }
            else if(data.choice1 != "-"){
                $('[role=record]').append('<li>?</li>');
            }
            else if(data.choice0 == "-" && data.choice1 == "-"){
                $('[role=message]').fadeOut(500);
                if(data.round != 'Game Over'){
                    $('[role=options] [role=choice]').attr('disabled', false);
$options.css({'opacity':1});
                }
                    
            }
            
            // WINNER ANNOUNCED
            if(winners.count('1') == gameLength){
                if(player == 1){
                    $('[role=message]').text('YOU WIN!').fadeIn(500).append('<br><button role="startgame">New Game</button>');
                } else {
                    $('[role=message]').text('You loose').fadeIn(500).append('<br><button role="startgame">New Game</button>');
                }
                $('#gamestats').hide();
               // ws.close();
                $('[role=options] [role=choice]').attr('disabled', 'disabled'); 
                $('#round').text('Game Over');
            } else if(winners.count('2') == gameLength){
                if(player == 2){
                    $('[role=message]').text('YOU WIN!').fadeIn(500).append('<br><button role="startgame">New Game</button>');
                } else {
                    $('[role=message]').text('You loose').fadeIn(500).append('<br><button role="startgame">New Game</button>');
                }
                
                $('#gamestats').hide();
                $('[role=options] [role=choice]').attr('disabled', 'disabled'); 
                $('#round').text('Game Over');
            } else { 
                $('#emailcode').attr('href', 'mailto:?subject=Want%20to%20Play%20Rock%20Paper%20Scissors%3F&body=I%20would%20like%20to%20play%20Rock%2C%20Paper%2C%20Scissors!%0ASimply%20click%20the%20link%20below%20to%20join%20my%20already%20in-progress%20game.%0A%0Ahttp%3A%2F%2Frps.digitalag.net%2F%3Fcode%3D'+code2+'%0A%0AWe%20promise%20that%20this%20game%20is%20between%20just%20you%20and%20your%20friend.%20We%20do%20not%20require%20any%20usernames%20or%20passwords%2C%20nor%20do%20we%20record%20your%20email%20address%20or%20any%20other%20user%20data.%0A%0ACopyright%20%C2%A9%202014%20Digital%20AG%20Studios%3B%20Kelowna%20BC%2C%20Canada%20V1Y%202C5.%20All%20Rights%20Reserved.');
            }
        }
        };
        ws.onerror = function(e){
           // console.log(e);
        };
    }
    
    ////////////////////////////////////////////////
    //
    //  FUNCTION: MAKE CHOICE
    //
    ////////////////////////////////////////////////
    function makeChoice(Player, Ch, Code){ 
        cP = Player==1?'':Player;
        var ws = new EventSource('process.php?action=choice&code='+Code+'&choice='+Ch+'&player='+Player);
        
        ws.onmessage = function(e) {
            var data = JSON.parse(e.data);
            if(data.draw){
                $('[role=message]').text('Draw').fadeIn(500);
            }
            ws.close();
        };
        ws.onerror = function(e){
            //console.log(e);
        };
        
    }
})(jQuery);
