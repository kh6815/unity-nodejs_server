
/**
 * MySQL 데이터베이스 사용하기
 *
 * 웹브라우저에서 아래 주소의 페이지를 열고 웹페이지에서 요청
 * (먼저 사용자 추가 후 로그인해야 함)
 *    http://localhost:3000/public/login2.html
 *    http://localhost:3000/public/adduser2.html
 *
 * @date 2016-11-10
 * @author Mike
 */

// 익스프레스 객체 생성
// Express 기본 모듈 불러오기
var express = require('express')
  , app = express()
  , http = require('http').Server(app)
  , path = require('path');

//소켓 통신
var io = require('socket.io').listen(http);

// Express의 미들웨어 불러오기
var bodyParser = require('body-parser')
  , cookieParser = require('cookie-parser')
  , static = require('serve-static');
//  , errorHandler = require('errorhandler');

// 에러 핸들러 모듈 사용
//var expressErrorHandler = require('express-error-handler');

// Session 미들웨어 불러오기
var expressSession = require('express-session');


//===== MySQL 데이터베이스를 사용할 수 있도록 하는 mysql 모듈 불러오기 =====//
var mysql = require('mysql');

//===== MySQL 데이터베이스 연결 설정 =====//
var pool      =    mysql.createPool({
    connectionLimit : 10,
    host     : 'localhost',
    user     : 'root',
    password : '1234',
    database : 'test',
    debug    :  false
});


// 설정 파일에 들어있는 port 정보 사용하여 포트 설정
app.set('port', process.env.PORT || 3000);

// body-parser를 이용해 application/x-www-form-urlencoded 파싱
app.use(bodyParser.urlencoded({ extended: false }))

// body-parser를 이용해 application/json 파싱
app.use(bodyParser.json())

// public 폴더를 static으로 오픈
app.use('/public', static(path.join(__dirname, 'public')));

// cookie-parser 설정
app.use(cookieParser());

// 세션 설정
app.use(expressSession({
	secret:'my key',
	resave:true,
	saveUninitialized:true
}));




//===== 라우팅 함수 등록 =====//

// 라우터 객체 참조
var router = express.Router();


// 로그인 처리 함수
router.route('/process/login').post(function(req, res) {
	console.log('/process/login 호출됨.');

	// 요청 파라미터 확인
    var paramId = req.body.id || req.query.id;
    var paramPassword = req.body.password || req.query.password;

    console.log('요청 파라미터 : ' + paramId + ', ' + paramPassword);

    // pool 객체가 초기화된 경우, authUser 함수 호출하여 사용자 인증
	if (pool) {
		authUser(paramId, paramPassword, function(err, rows) {
			// 에러 발생 시, 클라이언트로 에러 전송
			if (err) {
                console.error('사용자 로그인 중 에러 발생 : ' + err.stack);

                return;
            }

            // 결과 객체 있으면 성공 응답 전송
			if (rows) {
				console.dir(rows);

                //res.send("no");
                res.json({
                    message: "로그인 성공"
                });
			} else {
                res.json({
                    message: "로그인 실패"
                });
			}
		});
	} else {  // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
        console.error('데이터베이스 연결 실패 : ' + err.stack);
	}

});


// 사용자 추가 라우팅 함수
router.route('/process/adduser').post(function(req, res) {
	console.log('/process/adduser 호출됨.');

    var paramId = req.body.id || req.query.id;
    var paramPassword = req.body.password || req.query.password;
    //var paramName = req.body.name || req.query.name;
    var paramEmail = req.body.email || req.query.email;

    console.log('요청 파라미터 : ' + paramId + ', ' + paramPassword  + ', ' + paramEmail);

    // pool 객체가 초기화된 경우, addUser 함수 호출하여 사용자 추가
	if (pool) {
		addUser(paramId, paramEmail, paramPassword, function(err, row) {
			// 동일한 id로 추가하려는 경우 에러 발생 - 클라이언트로 에러 전송
			if (err) {
                console.error('사용자 추가 중 에러 발생 : ' + err.stack);

                return;
            }

            // 결과 객체 있으면 성공 응답 전송
			if (row) {
				console.dir(row);

			} else {

			}
		});
	} else {  // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
        console.error('데이터베이스 연결 실패 : ' + err.stack);
	}

});

//회원가입시 아이디 중복 체크
router.route('/process/idcheck').post(function(req, res){
    console.log('/process/idcheck 호출됨.');

    var paramId = req.body.id || req.query.id;

    console.log('요청 파라미터 : ' + paramId);

    // pool 객체가 초기화된 경우, authUser 함수 호출하여 사용자 인증
	if (pool) {
		idCheck(paramId, function(err, rows) {
			// 에러 발생 시, 클라이언트로 에러 전송
			if (err) {
                console.error('사용자 로그인 중 에러 발생 : ' + err.stack);
                return;
            }

            // 조회된 레코드가 있으면 성공 응답 전송
			if (rows) {
				console.dir(rows);

                // 조회 결과에서 사용자 이름 확인
				//var username = rows[0].name;
				//id가 중복되었음으로 유니티로 중복된 아이디라고 전송
                //res.send("no");
                res.json({
                    message: 'no'
                });

			} else {  // 조회된 레코드가 없는 경우 실패 응답 전송
                //id가 중복되지 않았음으로 유니티로 사용가능한 아이디라고 전송
                //res.send("ok");
                res.json({
                    message: 'yes'
                });
			}
		});
	} else {  // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            console.error('데이터베이스 연결 실패 : ' + err.stack);
	}
});

//아이디 찾기 함수
router.route('/process/findid').post(function(req, res){
    console.log('/process/findid 호출됨.');

    var paramEmail = req.body.email || req.query.email;

    console.log('요청 파라미터 : ' + paramEmail);

    // pool 객체가 초기화된 경우, authUser 함수 호출하여 사용자 인증
	if (pool) {
		FindID(paramEmail, function(err, rows) {
			// 에러 발생 시, 클라이언트로 에러 전송
			if (err) {
                console.error('사용자 로그인 중 에러 발생 : ' + err.stack);
                return;
            }

            // 조회된 레코드가 있으면 성공 응답 전송
			if (rows) {
				console.dir(rows);

                // 조회 결과에서 사용자 이름 확인
				//var username = rows[0].name;

				//이메일로 가입한 id들을 찾음
                //res.send("no");
                var templist = [];
                for(var i = 0; i < rows.length; i ++){
                    templist.push(rows[i].id)
                }
                res.json({
                    message: templist
                });

			} else {  // 조회된 레코드가 없는 경우 실패 응답 전송
                //이메일로 가입한 id가 없음
                //res.send("ok");
                res.json({
                    message: 'NULL'
                    //해당 이메일에 일치하는 아이디가 없음
                });
			}
		});
	} else {  // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            console.error('데이터베이스 연결 실패 : ' + err.stack);
	}
});

//패스워드찾기 함수
router.route('/process/findpw').post(function(req, res){
    console.log('/process/findpw 호출됨.');

    var paramId = req.body.id || req.query.id;
    var paramEmail = req.body.email || req.query.email;
    console.log('요청 파라미터 : ' + paramEmail);

    // pool 객체가 초기화된 경우, authUser 함수 호출하여 사용자 인증
	if (pool) {
		FindPW(paramId, paramEmail, function(err, rows) {
			// 에러 발생 시, 클라이언트로 에러 전송
			if (err) {
                console.error('사용자 로그인 중 에러 발생 : ' + err.stack);
                return;
            }

            // 조회된 레코드가 있으면 성공 응답 전송
			if (rows) {
				console.dir(rows);

                // 조회 결과에서 사용자 이름 확인
				//var username = rows[0].name;

				//이메일로 가입한 id들을 찾음
                //res.send("no");
                var userpw = rows[0].password;

                res.json({
                    pw: userpw
                });

			} else {  // 조회된 레코드가 없는 경우 실패 응답 전송
                //이메일로 가입한 id가 없음
                //res.send("ok");
                res.json({
                    pw: '해당 id, email에 일치하는 pw가 없음'
                });
			}
		});
	} else {  // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            console.error('데이터베이스 연결 실패 : ' + err.stack);
	}
});

//닉네임 저장 함수
router.route('/process/nickname').post(function(req, res){
    console.log('/process/nickname 호출됨.');

    var paramId = req.body.id || req.query.id;
    var paramName = req.body.name || req.query.name;

    console.log('요청 파라미터 : ' + paramName);

    // pool 객체가 초기화된 경우, authUser 함수 호출하여 사용자 인증
	if (pool) {
        UpdateName(paramName, paramId,function(err, rows) {
			// 에러 발생 시, 클라이언트로 에러 전송
			if (err) {
                console.error('사용자 로그인 중 에러 발생 : ' + err.stack);
                return;
            }

            // 조회된 레코드가 있으면 성공 응답 전송
			if (rows) {
				console.dir(rows);

                // 조회 결과에서 사용자 이름 확인
				//var username = rows[0].name;

				//이메일로 가입한 id들을 찾음
                //res.send("no");

                res.json({
                    message: '닉네임 설정성공'
                });

			} else {  // 조회된 레코드가 없는 경우 실패 응답 전송
                //이메일로 가입한 id가 없음
                //res.send("ok");
                res.json({
                    message: '닉네임 설정실패'
                });
			}
		});
	} else {  // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            console.error('데이터베이스 연결 실패 : ' + err.stack);
	}
});

//Update character
router.route('/process/updatecharacter').post(function(req, res){
    console.log('/process/updatacharacter 호출됨.');

    var paramId = req.body.id || req.query.id;
    var paramCharacterName = req.body.character || req.query.character;

    console.log('요청 파라미터 : ' + paramCharacterName);

    // pool 객체가 초기화된 경우, authUser 함수 호출하여 사용자 인증
	if (pool) {
        UpdateCharacterName(paramCharacterName, paramId,function(err, rows) {
			// 에러 발생 시, 클라이언트로 에러 전송
			if (err) {
                console.error('사용자 로그인 중 에러 발생 : ' + err.stack);
                return;
            }

            // 조회된 레코드가 있으면 성공 응답 전송
			if (rows) {
				console.dir(rows);


                res.json({
                    message: '캐릭터 설정 성공'
                });

			} else {  // 조회된 레코드가 없는 경우 실패 응답 전송
                res.json({
                    message: '캐릭터 설정 실패'
                });
			}
		});
	} else {  // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            console.error('데이터베이스 연결 실패 : ' + err.stack);
	}
});



// 라우터 객체 등록
app.use('/', router);


// 사용자를 인증하는 함수
var authUser = function(id, password, callback) {
	console.log('authUser 호출됨 : ' + id + ', ' + password);

	// 커넥션 풀에서 연결 객체를 가져옴
	pool.getConnection(function(err, conn) {
        if (err) {
        	if (conn) {
                conn.release();  // 반드시 해제해야 함
            }
            callback(err, null);
            return;
        }
        console.log('데이터베이스 연결 스레드 아이디 : ' + conn.threadId);

        var columns = ['id'];
        var tablename = 'users';

        // SQL 문을 실행합니다.
        var exec = conn.query("select ?? from ?? where id = ? and password = ?", [columns, tablename, id, password], function(err, rows) {
            conn.release();  // 반드시 해제해야 함
            console.log('실행 대상 SQL : ' + exec.sql);

            if (rows.length > 0) {
    	    	console.log('아이디 [%s], 패스워드 [%s] 가 일치하는 사용자 찾음.', id, password);
    	    	callback(null, rows);
            } else {
            	console.log("일치하는 사용자를 찾지 못함.");
    	    	callback(null, null);
            }
        });

        conn.on('error', function(err) {
            console.log('데이터베이스 연결 시 에러 발생함.');
            console.dir(err);

            callback(err, null);
      });
    });

}

//사용자를 등록하는 함수
var addUser = function(id, email, password, callback) {
	console.log('addUser 호출됨 : ' + id + ', ' + password + ', ' + email);

	// 커넥션 풀에서 연결 객체를 가져옴
	pool.getConnection(function(err, conn) {
        if (err) {
        	if (conn) {
                conn.release();  // 반드시 해제해야 함
            }

            callback(err, null);
            return;
        }
        console.log('데이터베이스 연결 스레드 아이디 : ' + conn.threadId);

    	// 데이터를 객체로 만듦
    	var data = {id:id, email:email, password:password};

        // SQL 문을 실행함
        var exec = conn.query('insert into users set ?', data, function(err, result) {
        	conn.release();  // 반드시 해제해야 함
        	console.log('실행 대상 SQL : ' + exec.sql);

        	if (err) {
        		console.log('SQL 실행 시 에러 발생함.');
        		console.dir(err);

        		callback(err, null);

        		return;
        	}

        	callback(null, result);

        });

        conn.on('error', function(err) {
              console.log('데이터베이스 연결 시 에러 발생함.');
              console.dir(err);

              callback(err, null);
        });
    });

}

//id를 체크하는 함수
var idCheck = function(id, callback) {
	console.log('idCheck 호출됨 : ' + id);

// 커넥션 풀에서 연결 객체를 가져옴
	pool.getConnection(function(err, conn) {
        if (err) {
        	if (conn) {
                conn.release();  // 반드시 해제해야 함
            }
            callback(err, null);
            return;
        }
        console.log('데이터베이스 연결 스레드 아이디 : ' + conn.threadId);

        var columns = ['id'];
        var tablename = 'users';

        // SQL 문을 실행합니다.
        var exec = conn.query("select ?? from ?? where id = ?", [columns, tablename, id], function(err, rows) {
            conn.release();  // 반드시 해제해야 함
            console.log('실행 대상 SQL : ' + exec.sql);

            if (rows.length > 0) {
    	    	console.log('아이디 [%s], 일치하는 사용자 이미 있음.', id);
    	    	callback(null, rows);
            } else {
            	console.log("일치하는 사용자를 찾지 못함.");
    	    	callback(null, null);
            }
        });

        conn.on('error', function(err) {
            console.log('데이터베이스 연결 시 에러 발생함.');
            console.dir(err);

            callback(err, null);
      });
    });
}

//id를 찾는 함수
var FindID = function(email, callback) {
	console.log('FindID 호출됨 : ' + email);

// 커넥션 풀에서 연결 객체를 가져옴
	pool.getConnection(function(err, conn) {
        if (err) {
        	if (conn) {
                conn.release();  // 반드시 해제해야 함
            }
            callback(err, null);
            return;
        }
        console.log('데이터베이스 연결 스레드 아이디 : ' + conn.threadId);

        var columns = ['id'];
        var tablename = 'users';

        // SQL 문을 실행합니다.
        var exec = conn.query("select ?? from ?? where email = ?", [columns, tablename, email], function(err, rows) {
            conn.release();  // 반드시 해제해야 함
            console.log('실행 대상 SQL : ' + exec.sql);

            if (rows.length > 0) {
    	    	console.log('이메일 [%s], 일치하는 사용자 id 있음.', email);
    	    	callback(null, rows);
            } else {
            	console.log("이메일 일치하는 사용자를 찾지 못함.");
    	    	callback(null, null);
            }
        });

        conn.on('error', function(err) {
            console.log('데이터베이스 연결 시 에러 발생함.');
            console.dir(err);

            callback(err, null);
      });
    });
}
//pw를 찾는 함수
var FindPW = function(id, email, callback) {
	console.log('FindPW 호출됨 : ' + email);

// 커넥션 풀에서 연결 객체를 가져옴
	pool.getConnection(function(err, conn) {
        if (err) {
        	if (conn) {
                conn.release();  // 반드시 해제해야 함
            }
            callback(err, null);
            return;
        }
        console.log('데이터베이스 연결 스레드 아이디 : ' + conn.threadId);

        var columns = ['password'];
        var tablename = 'users';

        // SQL 문을 실행합니다.
        var exec = conn.query("select ?? from ?? where id = ? and email = ?", [columns, tablename, id, email], function(err, rows) {
            conn.release();  // 반드시 해제해야 함
            console.log('실행 대상 SQL : ' + exec.sql);

            if (rows.length > 0) {
    	    	console.log('id [%s] , email [%s], 일치하는 사용자 pw 있음.',id, email );
    	    	callback(null, rows);
            } else {
            	console.log("일치하는 사용자 pw를 찾지 못함.");
    	    	callback(null, null);
            }
        });

        conn.on('error', function(err) {
            console.log('데이터베이스 연결 시 에러 발생함.');
            console.dir(err);

            callback(err, null);
      });
    });
}

//이름 업데이트
var UpdateName = function(name, id, callback){
    console.log('UpdateName 호출됨 : ' + name);

// 커넥션 풀에서 연결 객체를 가져옴
	pool.getConnection(function(err, conn) {
        if (err) {
        	if (conn) {
                conn.release();  // 반드시 해제해야 함
            }
            callback(err, null);
            return;
        }
        console.log('데이터베이스 연결 스레드 아이디 : ' + conn.threadId);

        var tablename = 'users';

        // SQL 문을 실행합니다.
        var exec = conn.query("update ?? set name = ? where id = ?", [tablename, name, id], function(err, rows) {
            conn.release();  // 반드시 해제해야 함
            console.log('실행 대상 SQL : ' + exec.sql);

    	   console.log('name 업데이트 완료');
    	   callback(null, rows);
        });

        conn.on('error', function(err) {
            console.log('데이터베이스 연결 시 에러 발생함.');
            console.dir(err);

            callback(err, null);
      });
    });
}

//캐릭터 업데이트
var UpdateCharacterName = function(character, id, callback){
    console.log('UpdateCharacterName 호출됨 : ' + character);

// 커넥션 풀에서 연결 객체를 가져옴
	pool.getConnection(function(err, conn) {
        if (err) {
        	if (conn) {
                conn.release();  // 반드시 해제해야 함
            }
            callback(err, null);
            return;
        }
        console.log('데이터베이스 연결 스레드 아이디 : ' + conn.threadId);

        var tablename = 'users';

        // SQL 문을 실행합니다.
        var exec = conn.query("update ?? set ch = ? where id = ?", [tablename, character, id], function(err, rows) {
            conn.release();  // 반드시 해제해야 함
            console.log('실행 대상 SQL : ' + exec.sql);

    	   console.log('character 업데이트 완료');
    	   callback(null, rows);
        });

        conn.on('error', function(err) {
            console.log('데이터베이스 연결 시 에러 발생함.');
            console.dir(err);

            callback(err, null);
      });
    });
}

/*
// 404 에러 페이지 처리
var errorHandler = expressErrorHandler({
 static: {
   '404': './public/404.html'
 }
});

app.use( expressErrorHandler.httpError(404) );
app.use( errorHandler );*/


//===== 서버 시작 =====//

// 프로세스 종료 시에 데이터베이스 연결 해제
process.on('SIGTERM', function () {
    console.log("프로세스가 종료됩니다.");
});

/*
app.on('close', function () {
	console.log("Express 서버 객체가 종료됩니다.");
});*/


//게임룸만들고 게임 시작 카운터 변수, 이미지 매칭번호 변수 생성
var gameroom = [{
    GameStartCount : 0,
    imageMatchingCount : 0
}, {
    GameStartCount : 0,
    imageMatchingCount : 0
}];
//0번방, 1번방 생성
var clients1 = [];
var clients2 = [];

var example =0;

var image_count_number = 0;
var PlayerVote = 0;

//소켓 연결 기다림
io.on('connection', function(socket){
    console.log('a user connected');

/*
    if(image_count_number < 5)
    {
        image_count_number = image_count_number + 1;
        var count_number = {
            image_count : JSON.parse(image_count_number)
        }
        console.log(count_number.image_count);
        socket.emit("ImageCount", count_number);
    }
*/
    //소켓 연결이 끊어졌을 때
    socket.on('disconnect', function(){
      console.log('user disconnected');
    });
    //룸 세팅 이벤트
    socket.on("Waiting", function(data){ //룸 유저 수 보여주기 위한 메서드
        console.log("WaitingRoom에 들어옴");
         var msg = {
             room1 : gameroom[0].imageMatchingCount,
             room2 : gameroom[1].imageMatchingCount
         }

         socket.emit('resWaitingRoom', msg); //자기 자신한테 보내기
    });
    //방에 합류할 때
    socket.on("JoinRoom", function(data){
        console.log(typeof(data));
        var msg = JSON.parse(data);
        var RoomName = msg.RoomName; //0번방 또는 1번방
        var UserID = msg.UserID;
        var UserName = msg.UserName;
        var Character = msg.Character;

        console.log(UserName);

        if(RoomName == "Room 1") { //room1에 참가
            if(gameroom[0].GameStartCount < 5){//게임이 시작되었으면 참가 못하게하기위함.
                socket.join(0);//방에 참가

                clients1.push({
                UserID : msg.UserID,
                UserName : msg.UserName,
                UserCharacter : msg.Character,
                JoinRoomNumber : 0,
                imageNumber : ++gameroom[0].imageMatchingCount,
                readyCheck : false,
                isImposter : false,
                //iscitizen : true,
                //isghost :false
                });


                var temp = {
                    USER : clients1,
                    GameStartCount : gameroom[0].GameStartCount
                }

                io.sockets.in(0).emit("JoinRoomUserInfo", temp);

                }
            else{
                socket.emit("Can't_Join", "게임중인 방에 참여할 수 없습니다.");
            }
                    //userid, image랑 매칭할 숫자값?,
        }
        else if(RoomName == "Room 2"){//room2
            socket.join(1);
            //userid, image랑 매칭할 숫자값?,
             //클라이언트쪽에 저장해놓을 데이터
            var NewthisPlayer = {
                userid : UserID,
                name : UserName,
                joinRoomNumber : 1,
                imageNumber : ++gameroom[1].imageMatchingCount,
                readyCheck : false
            }
            clients2.push(NewthisPlayer);


            io.sockets.in(1).emit("JoinRoomUserInfo", temp);
        }


        //생성되어 있는 room1 or room2에 새로운 유저를 추가

        //io.to(roomNumber).broadcast.emit('JoinRoom', temp);
    });

    //방 떠날 때
    socket.on("LeaveRoom",function(data){
        console.log(typeof(data));
        console.log("LeaveRoom에 들어옴");
        var msg = JSON.parse(data);
        var UserID = msg.UserID;
        var RoomName = msg.RoomName;
        var i,j,checkNum;

        if(RoomName == "Room 1"){
            for(i = 0; i < clients1.length; i++){
                if(clients1[i].UserID == msg.UserID){
                     if(clients1[i].readyCheck == false){
                        //gameroom[0].GameStartCount--;
                        gameroom[0].imageMatchingCount--;
                        clients1.splice(i, 1);
                        socket.leave(0);
                         break;
                    }
                    else{
                        gameroom[0].GameStartCount--;
                        gameroom[0].imageMatchingCount--;
                        clients1.splice(i, 1);
                        socket.leave(0);
                        break;
                    }
                }
            }

            for(i = 1; i <= gameroom[0].imageMatchingCount; i++ ){
                clients1[i-1].imageNumber = i; //이미지 넘버 리셋
            }
            var temp = {
                USER : clients1,
                GameStartCount : gameroom[0].GameStartCount
            }
            io.sockets.in(1).emit("NewLeaveRoomUserInfo", temp);
        }
        else if(RoomName == "Room 2"){

        }
    });

    //유저들이 레디 버튼을 눌렀을 때
    socket.on("ReadyButton", function(data){
        console.log(typeof(data));
        var msg = JSON.parse(data);
        var UserID = msg.UserID;
        var RoomName = msg.RoomName;
        var ReadCheck= msg.ReadyCheck;
        var i;

        if(RoomName == "Room 1"){

            for(i = 0; i < clients1.length; i++){
                if(clients1[i].UserID == msg.UserID){
                    if(clients1[i].readyCheck == false){
                        clients1[i].readyCheck = true;
                        gameroom[0].GameStartCount++;
                    }
                    else{
                        clients1[i].readyCheck = false;
                        gameroom[0].GameStartCount--;
                    }
                    break;
                }
            }
            if(gameroom[0].GameStartCount == 2){
                var ImposterNumber =  Math.floor(Math.random() * 10) % 2 // 일단 0, 1

                //clients1[ImposterNumber].isImposter = true;
                clients1[0].isImposter = true;

                var temp = {
                    USER : clients1,
                    GameStartCount : gameroom[0].GameStartCount//오류 뜰수도 있으니까 그냥 넘겨줌
                }
                io.sockets.in(0).emit("GameStart", temp);
            }
            else{
                var temp = {
                    USER : clients1,
                     GameStartCount : gameroom[0].GameStartCount
                    //count도 보내주자
                }
                io.sockets.in(0).emit("GameStartCount", temp);
            }
        }
        else if(RoomName == "Room 2"){
            var check = 0;
        }
    });


    socket.on("exampleMsg", function(data){
        var msg = JSON.parse(data);
        var name = msg.name;
        var text = msg.text;
        console.log(name);
        console.log(text);

        socket.broadcast.emit("SendToServerMsg", msg);
    });

    socket.on("kill", function(data){
        var msg = JSON.parse(data);
        console.log("kill");
        console.log(msg);
        socket.broadcast.emit("serverSendKillInfo", msg);
    });




    socket.on("SendMissionScore", function(data){
        var missionscore = JSON.parse(data);
        var mission = {
            taskbarscore : missionscore.taskbarscore
        }
        socket.broadcast.emit("GetMissionScore", mission);
    });

    socket.on("SendSabotageIndex", function(data){
        var SabotageIndex = JSON.parse(data);
        var SabotageIndeX ={
            index : SabotageIndex.index
        }
        console.log(SabotageIndeX);
                console.log(SabotageIndex);
        socket.broadcast.emit("GetSabotageIndex", SabotageIndeX);
    });





    socket.on("Msg", function(data){
        var msg = JSON.parse(data);

        socket.broadcast.emit("MsgRes", msg);
    });


    socket.on("move1", function(data){
        var msg = JSON.parse(data);

        console.log(msg);
        socket.broadcast.emit("sendTomove1", msg);
    });

    socket.on("move2", function(data){
        var msg = JSON.parse(data);

        socket.broadcast.emit("sendTomove2", msg);
    });
    socket.on("move3", function(data){
        var msg = JSON.parse(data);

        socket.broadcast.emit("sendTomove3", msg);
    });
    socket.on("move4", function(data){
        var msg = JSON.parse(data);

        socket.broadcast.emit("sendTomove4", msg);
    });
    socket.on("move5", function(data){
        var msg = JSON.parse(data);

         socket.broadcast.emit("sendTomove5", msg);
    });

    socket.on("SendPlayerMeeting", function(data){
        var playerMeeting = JSON.parse(data);
        var getPlayerMeeting = {
            isItMeeting : playerMeeting.isItMeeting,
            playerName : playerMeeting.playerName
        }
        console.log(getPlayerMeeting);
        console.log(playerMeeting);
        io.sockets.in(0).emit("GetPlayerMeeting", getPlayerMeeting);
        //socket.emit("GetPlayerMeeting", getPlayerMeeting);
    });
  socket.on("SendPlayerVote", function(data){
        var sendVotePlayer = JSON.parse(data);
        var getVotePlayer = {
            votedPlayerIndex : sendVotePlayer.votedPlayerIndex,
            pointedOutPlayerIndex : sendVotePlayer.pointedOutPlayerIndex,
            PlayerVote : PlayerVote + 1,
            VoteDone : false
        }
        if(getVotePlayer.PlayerVote == 2)
        {
            getVotePlayer.VoteDone = true;
            console.log(getVotePlayer);
        }
        io.sockets.in(0).emit("GetPlayerVote", getVotePlayer);
    });
});




http.listen(12345, function(){
  console.log('listening on *:8080');
});
