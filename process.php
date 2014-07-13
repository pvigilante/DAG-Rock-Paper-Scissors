<?php
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache'); // recommended to prevent caching of event data.
$choice     = isset($_REQUEST['choice'])?$_REQUEST['choice']:false;
$code       = isset($_REQUEST['code'])?$_REQUEST['code']:false;
$code2      = isset($_REQUEST['code2'])?$_REQUEST['code2']:false;
$action     = isset($_REQUEST['action'])?$_REQUEST['action']:false;
$gametype   = isset($_REQUEST['gametype'])?$_REQUEST['gametype']:false;
$gamelength = isset($_REQUEST['gamelength'])?$_REQUEST['gamelength']:false;
$players    = isset($_REQUEST['players'])?$_REQUEST['players']:false;
$player     = isset($_REQUEST['player'])?$_REQUEST['player']:false;
$con=mysqli_connect("localhost", "root","root","rps");
//$con=mysqli_connect("eassionsionanc.db.5938340.hostedresource.com", "eassionsionanc","ZZpM4D4G4eA@SM","eassionsionanc");
if (mysqli_connect_errno()) echo "data:Failed to connect to MySQL: " . mysqli_connect_error(). PHP_EOL;
if($action){
    switch ($action) {
        case 'newcodes':
            $code = sha1(date('Y-m-dH:i:s'));
            $code2 = sha1(date('H:i:sY-m-d'));
            $code = $code.'a';
            $code2 = $code2.'b';
            $record = '';
            for($r = 0; $r <= $gamelength; $r++){
                for($p = 0; $p < $players; $p++){
                    $record .= '-';
                }
                $record .= '|';
            }
            
            $sql = 'INSERT INTO rps (code, code2, gametype, gamelength, players,record)
                    VALUES ("'.$code.'","'.$code2.'",'.$gametype.','.$gamelength.','.$players.',"'.$record.'")';
            if(mysqli_query($con,$sql)){
                $sql2="SELECT * FROM rps WHERE code='".$code."'";
                $result = mysqli_query($con,$sql2);
                while($row = mysqli_fetch_array($result)){
                    echo 'data: {';
                    echo '"code":"'.$row['code'].'",'; 
                    echo '"code2":"'.$row['code2'].'",';
                    echo '"player":"1",'; 
                    echo '"players":"'.$row['players'].'",'; 
                    echo '"gametype":"'.$row['gametype'].'",';
                    echo '"round":"1",';
                    echo '"turn":"true",';
                    echo '"gamelength":"'.$row['gamelength'].'"';
                    echo '}' .PHP_EOL;
                }
            } 
        break;
        case 'newgame':
            $pl = $player > 1?$player:'';
            $record = '';
            for($r = 0; $r <= $gamelength; $r++){
                for($p = 0; $p < $players; $p++){
                    $record .= '-';
                }
                $record .= '|';
            }
            $sql = "UPDATE rps SET record='".$record."' WHERE code='".$code."' OR code2='".$code."'";
            if(mysqli_query($con,$sql)){
                $sql2="SELECT * FROM rps WHERE code='".$code."' OR code2='".$code."'";
                $result = mysqli_query($con,$sql2);
                while($row = mysqli_fetch_array($result)){
                    echo 'data: {';
                    echo '"code":"'.$row['code'].'",'; 
                    echo '"code2":"'.$row['code2'].'",';
                    echo '"player":"1",'; 
                    echo '"players":"'.$row['players'].'",'; 
                    echo '"gametype":"'.$row['gametype'].'",';
                    echo '"round":"1",';
                    echo '"turn":"true",';
                    echo '"gamelength":"'.$row['gamelength'].'"';
                    echo '}' .PHP_EOL;
                }
            } 
        break;
        case 'status':
            $pl = $player > 1?$player:'';
            $sql2 = "SELECT * FROM rps WHERE code".$pl."='".$code."'";
            $result = mysqli_query($con,$sql2);
            if(mysqli_num_rows($result) > 0){
                while($row = mysqli_fetch_array($result)){
                    $recs = explode('|', $row['record']);
                    $curpl = $player - 1;
                    $nextpl = $player < strlen($recs[0])?$player + 1:'';
                    $nextpli = $curpl < (strlen($recs[0]) - 1)?$curpl + 1:0;
                    
                    //echo 'retry:1000\n';
                    echo 'data: {';
                    echo '"code":"'.$row['code'.$pl].'",';
                    echo '"code2":"'.$row['code'.$nextpl].'",'; 
                    echo '"player":"'.$player.'",';
                    echo '"players":"'.$row['players'].'",';
                    echo '"gametype":"'.$row['gametype'].'",';
                    foreach($recs as $k => $v){
                        if($k == ($row['gamelength'] + 1)){
                            echo '"round":"Game Over",';
                            echo '"turn":"false",';
                            break;
                        } else {
                            echo '"round":"'.($k+1).'",';
                            echo '"record":"'.$row['record'].'",';
                        }
                        if(is_numeric($v[$curpl]) && is_numeric($v[$nextpli])){
                            echo '"choice0":"'.$v[$curpl].'",';
                            echo '"choice1":"'.$v[$nextpli].'",';
                            echo '"turn":"true",';
                            echo '"winner'.$k.'":"'.getWinner($v[0], $v[1]).'",';
                        }
                        elseif(is_numeric($v[$curpl])){
                            echo '"choice0":"'.$v[$curpl].'",';
                            echo '"choice1":"-",';
                            if($v[$nextpli] == '-'){ 
                                echo '"turn":"false",';
                                break; 
                            } else {
                                echo '"turn":"true",';
                                break; 
                            }
                            break;
                        } elseif(is_numeric($v[$nextpli])){
                            echo '"turn":"true",';
                            echo '"choice1":"'.$v[$nextpli].'",';
                            echo '"choice0":"-",';
                            break;
                        } else {
                            echo '"turn":"true",';
                             echo '"choice1":"-",';
                            echo '"choice0":"-",';
                            break;
                        }
                    }
                    echo '"gamelength":"'.$row['gamelength'].'"';
                    echo '}' .PHP_EOL;
                }
            }
        break;
        case 'choice':
            $pl = $player > 1?$player:'';
            $sql2 = "SELECT record, code".$pl." FROM rps WHERE code".$pl."='".$code."'";
            $result = mysqli_query($con,$sql2);
            if(mysqli_num_rows($result) > 0){
                while($row = mysqli_fetch_array($result)){
                    $recs = explode('|',$row['record']);
                    $curpl = $player <= strlen($recs[0])?$player - 1:$player;
                    $nextpl = $curpl < strlen($recs[0])?$player + 1:1;
                    $draw = '';
                    foreach($recs as $k => $v){
                        if($v[$curpl] == '-'){ 
                            $recs[$k][$curpl] = $choice; 
                           if($recs[$k][0] == $recs[$k][1]){
                                $recs[$k][0] = '-';
                                $recs[$k][1] = '-';
                                $draw = '"draw":"true",';
                            }
                            break;
                        } 
                    }
                    $recs = implode('|',$recs);
                    $sql3 = "UPDATE rps SET record='".$recs."' WHERE code".$pl."='".$code."'";
                    $result = mysqli_query($con,$sql3);
                    echo 'data: {';
                    echo $draw;
                    echo '"record":"'.$recs.'"';
                    echo '}' .PHP_EOL;
                }
            } 
        break;
        default:
            echo 'data: Error in Switch '. PHP_EOL;
        break;
    }
} 
function getWinner($op1, $op2){
    if($op1 == 0 && $op2 == 1){
        return '2'.$op1.$op2;
    } else if($op1 == 0 && $op2 == 2) {
        return '1'.$op1.$op2;
    } else if($op1 == 0 && $op2 == 0) {
        return '0'.$op1.$op2;
    }
    if($op1 == 1 && $op2 == 2){
        return '2'.$op1.$op2;
    } else if($op1 == 1 && $op2 == 0) {
        return '1'.$op1.$op2;
    } else if($op1 == 1 && $op2 == 1) {
        return '0'.$op1.$op2;
    }
    if($op1 == 2 && $op2 == 0){
        return '2'.$op1.$op2;
    } else if($op1 == 2 && $op2 == 1) {
        return '1'.$op1.$op2;
    } else if($op1 == 2 && $op2 == 2) {
        return '0'.$op1.$op2;
    }
}
echo PHP_EOL;
ob_flush();
flush();
?>