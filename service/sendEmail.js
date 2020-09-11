var nodemailer = require("nodemailer");
var mailCredential = require("./mailCredential");

module.exports = (mailOptions) => {
    var smtpTransport = nodemailer.createTransport(mailCredential);
    smtpTransport.sendMail(mailOptions, function (error, response) {
        if (error) {
            console.log(error);
            res.end("error");
        } else {
            // console.log("Message sent: " + response.messageId);
        }
    })
}