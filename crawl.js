const cheerio = require('cheerio');
const request = require('request');
const fs = require('fs');
const nodemailer = require('nodemailer');
const email = require('./email');

function Crawler() {
  request('https://truyencv.com/tuyet-pham-linh-tien/', function(err, res, body) {
    //  Sử dụng cheerio.load để lấy dữ liệu trả về
    var $ = cheerio.load(body);
    //  Lấy chương mới nhất của truyện
    var newestChap = $('.list-overview .item .item-value a').text();
    var obj = {
      newestChap: newestChap
    };
    var json = JSON.stringify(obj);

    //  Kiểm tra file newchap.json tồn tại không
    if (!fs.existsSync('newchap.json')) {
      //  Nếu chưa tồn tại tạo file  mới
      fs.writeFile('newchap.json', json, '', (err) => {
        if (err) throw err;
        console.log('Tạo file newchap.json thành công!');
      });
      return;
    }

    //  Đọc file newchap.json nằm trong thư mục dự án
    fs.readFile('newchap.json', function readFileCallback(err, data) {
      if (err) {
        console.log('Đọc file newchap.json thất bại!');
        return;
      } else {
        // Lấy chương truyện mới nhất từ file json
        obj = JSON.parse(data);
        var dbChap = obj.newestChap;
        //  So sánh 2 chương truyện nếu khác nhau -> đã có chương mới
        if (newestChap !== dbChap) {
          //  Lưu chương mới vào file newchap.json
          fs.writeFile('newchap.json', json, '', (err) => {
            if (err) throw err;
            console.log('Đã có chương mới!');
            console.log('Cập nhật newchap.json thành công!');
          });
          //  Lấy đường dẫn chương truyện mới
          var detailUrl = $('.list-overview .item .item-value a').attr('href');
          //  Tạo yêu cầu mới -> lấy thông tin chương mới
          request(detailUrl, (err, res, body) => {
            let cheerioDetail = cheerio.load(body);
            let contentDetail = cheerioDetail('.truyencv-read-content .content').text();

            if (!fs.existsSync('newchapContent.json')) {
              //  Nếu chưa tồn tại tạo file  mới
              fs.writeFile('newchapContent.json', contentDetail, '', (err) => {
                if (err) throw err;
                console.log('Tạo file newchapContent.json thành công!');
              });
              return;
            }

            // Gửi email thông báo
            sendEmail(newestChap, contentDetail);
          });
        } else {
          console.log('Chưa có chương mới!');
        }
      }
    });
  });
}

function sendEmail(subject, content) {
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: email.user,
      pass: email.password
    }
  });
  var mailOptions = {
    from: 'diennguyenduy1@gmail.com',
    to: 'diennguyenduy2@gmail.com',
    subject: 'Tuyet pham linh tien ra chuong moi ' + subject,
    text: content
  };
  transporter.sendMail(mailOptions, function(err, info) {
    if (err) {
      console.log('Lỗi khi gửi mail: ', err);
    } else {
      console.log('Đã gửi email: ', info.response);
    }
  });
}

var timer = setInterval(function() {
  return Crawler();
}, 5000);
