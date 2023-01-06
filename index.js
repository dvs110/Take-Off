// https://git.heroku.com/devangproject1.git

import express from "express"
import mongoose from "mongoose"
import dotenv from "dotenv"
import path from "path"
dotenv.config();
import bcrypt from "bcryptjs";
import request from "request"
import nodemailer from 'nodemailer';
import schedule from 'node-schedule';
import { createError } from "./utils/error.js";
const app = express()

const port = process.env.PORT || 5000;
app.use(express.urlencoded({ extended: false }))
import Flight from "./models/flight.js"

app.use(express.json());

// mongoose.connect(process.env.MONGO, { useNewUrlParser: true });
const connect = async () => {
    try {
        await mongoose.connect(process.env.key);
        console.log("connected to mondodb");
    } catch (error) {
        throw error;
    }
}
mongoose.connection.on('disconnected', () => { //if mongodb got disconnected
    console.log("mongodb disconnected");
});

const date_ob = new Date();


let transporter = nodemailer.createTransport({
    host: 'mail.google.com',
    port: 465,
    secure: true,
    service: 'gmail',

    auth: {
        user: process.env.EMAIL,
        pass: process.env.app_password,
    },
    tls: {
        rejectUnauthorized: false
    }
});

app.post('/delete', async (req, res, next) => {
    try {
        console.log(req.body);
        const flight = await Flight.findOne({ email: req.body.email })
        console.log(flight);
        if (flight == null) {
            res.status(200).json(0)
        } else {
            let isPasswordCorrect
            isPasswordCorrect = await bcrypt.compare(req.body.password, flight.password);
            if (isPasswordCorrect) {
                await Flight.findByIdAndDelete(flight._id);
                res.status(200).json(1)
            }
            else
                res.status(200).json(2)
        }
    } catch (err) {
        console.log(err);
        res.status(200).json("error aa gaya")
        next(err)
    }
})


app.post('/form', async (req, res, next) => {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt);
    // console.log(req.body);
    const newFlight = new Flight(
        { ...req.body, password: hash }
    );
    console.log(newFlight);
    try {
        const savedflight = await newFlight.save();
        res.status(200).json(savedflight)

    } catch (err) {
        next(err)
    }
});


app.post("/verify", async (req, res, next) => {
    try {
        // console.log(req.body);
        const flight = await Flight.findOne({ email: req.body.email })
        // console.log(flight);
        if (flight) {
            res.status(200).json(0)
        } else {
            res.status(200).json(1)
        }


    } catch (err) {
        console.log(err);
        res.status(200).json("error")
        next(err)
    }

})


app.post("/update", async (req, res, next) => {
    try {
        console.log(req.body);
        const flight = await Flight.findOne({ email: req.body.email })
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(req.body.password, salt);
        const updateflight = await Flight.findByIdAndUpdate(flight._id, { $set: { ...req.body, password: hash } }, { new: true });
        res.status(200).json(4)
    } catch (err) {
        return next(err);
    }

})




app.use((err, req, res, next) => {
    const errorStatus = err.status || 500;
    const errorMessage = err.message || "something went wrong";
    return res.status(errorStatus).json({
        success: false,
        status: errorStatus,
        message: errorMessage
    });
})

const j = schedule.scheduleJob({ hour: 1, minute: 1, dayOfWeek: date_ob.getDay() }, function () {
    const q = new Date();
    const l = q.getFullYear();
    let r = q.getMonth() + 1;
    let p = q.getDate()
    let s;
    if (p / 10 < 1 && r / 10 < 1)
        s = `${l}-0${r}-0${p}`
    else if (p / 10 < 1 && r / 10 > 1)
        s = `${l}-0${r}-${p}`
    else if (p / 10 > 1 && r / 10 < 1)
        s = `${l}-${r}-0${p}`
    else
        s = `${l}-${r}-${p}`
    const a = async () => {
        await Flight.deleteMany({ date: s });
    }
    a();
})

const job = schedule.scheduleJob({ hour: 20, minute: 1, dayOfWeek: date_ob.getDay() }, function () {
    const d = new Date();
    const l = d.getFullYear();
    let r = d.getMonth() + 1;
    let p = d.getDate()
    let s;
    if (p / 10 < 1 && r / 10 < 1)
        s = `${l}-0${r}-0${p}`
    else if (p / 10 < 1 && r / 10 >= 1)
        s = `${l}-${r}-0${p}`
    else if (p / 10 >= 1 && r / 10 < 1)
        s = `${l}-0${r}-${p}`
    else if (p / 10 >= 1 && r / 10 >= 1)
        s = `${l}-${r}-${p}`
    console.log(s);

    Flight.find(function (err, userx) {
        if (err) {
            throw err;
        }
        else {
            //add this code sentence
            var user_arr = Object.keys(userx).map( //converting to an array
                function (key) {
                    return userx[key];
                }
            ); //now, use forEach sentence
            console.log(user_arr.length);
            if (user_arr.length > 0) {
                user_arr.forEach(async function (us) {
                    'use strict';
                    const url = `https://api.flightapi.io/onewaytrip/${process.env.api_key}/${us.airport}/${us.arrivalairport}/${us.date}/1/0/0/Economy/USD`
                    await request.get({
                        url: url,
                        json: true,
                        headers: { 'User-Agent': 'request' }
                    }, (err, res, data) => {
                        if (err) {
                            console.log('Error:', err);
                            var mailOptions = {
                                from: '<joeymercury497@gmail.com>',
                                to: us.email,//email to be sended
                                subject: "FLIGHTS_INFOMATION  ",
                                html: "<div><h1 style='font-weight:bold'>FLIGHTS NOT AVAILABLE YET</h1></div>"  // html body
                            };
                            transporter.sendMail(mailOptions, (error, info) => {
                                if (error) {
                                    return console.log(error);
                                }
                                console.log('Message sent: %s', info.messageId);
                                console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                            });
                        } else {
                            let html0, html1, html2, html3, html4;
                            html0 = `<div className="outer-artile-div" style='max-width: 100vw;background-color: #fff;'><div className="article-section" style='width:60%;margin:auto;text-align: center;@media screen and (max-width:640px) {.article-section{width:80%;}}'> <h1 style='color:#0b1560;word-spacing: 2px;letter-spacing: 1px;font-size: 2.5rem;@media screen and (max-width:640px) { .article-section h1{font-size: 2rem;}}'>HI ${us.name}</h1><p style=' width:90%;margin:auto;@media screen and (max-width:640px) {.article-section p{width:85%;margin: auto;}}'>Your trip to Helsinki starts on 12.08.2022. Make your trip easier, and check in online now for yourself and your travel companions. Also check out our additional service below, and make the most of your trip.</p><button className='emailBtn'style=' padding:1rem;margin-top:1.5rem;padding-left:3rem;padding-right:3rem;background-color:#0b1560;color: #fff;border-radius: 5px;font-size: 1rem;-webkit-border-radius: 5px;-moz-border-radius: 5px;-ms-border-radius: 5px;-o-border-radius: 5px;'>BOOK NOW</button></div></div>`
                            html4 = `<div className="outer-footer-section" style='max-width:100vw;'><div className="foot-section" style='display:flex;width:60%;background-color:#0b1560;margin:auto;color: #fff;@media screen and (max-width:640px) {.foot-section{display:flex;flex-direction: column;width:80%;background-color:#0b1560;color: #fff;}}'> <div className="left-part" style='flex:1.5;margin:2rem 3rem;'><h3>Info</h3><p @media screen and (max-width:640px) {style='font-size: 1.1rem;margin:0}'>Stay up-to-date with current activities and future events by following us on your favorite social media channels.</p></div><div className="right-part" style='flex:1.2;margin: 2rem;'><h3>Contact Us</h3><address>Ashley Hall Uttarakhand</address><p>8449598365</p></div></div></div>`

                            console.log(data);
                            if (data.legs[0]) {
                                let airlineCode1 = "";
                                for (var i = 0; i < data.legs[0].airlineCodes.length; i++) {
                                    airlineCode1 = airlineCode1 + `${data.legs[0].airlineCodes[i]}  `
                                }
                                let departureTime1 = data.legs[0].departureTime;
                                let arrivalTime1 = data.legs[0].arrivalTime;
                                let duration1 = data.legs[0].duration;
                                let segment1 = "";
                                for (var i = 0; i < data.legs[0].segments.length; i++) {
                                    segment1 = segment1 + `${data.legs[0].segments[i].arrivalAirportCode}  `
                                }
                                html1 = `<div className="outer-flight-div" style='max-width: 100vw;'><div className="flight-section" style='width:60%;background-color: blue;margin:auto;@media screen and (max-width:640px) {.flight-section{width:80%;}}'><h1 style='text-align: center;margin-top: 2rem;padding-top:4rem;@media screen and (max-width:640px) {h1{text-align: center;margin-top: 2rem;padding-top:3rem;}}'>FLIGHTS AVAILABLE</h1><p style='margin-top: 2rem;text-align: center;font-size: 1.2rem;font-weight: 600;@media screen and (max-width:640px) { .flight-section p{margin:1.2rem}}'>Your first flight from <span style='color:#0b1560;'>${us.airport}</span> to <spanstyle='color:#0b1560;'>${us.arrivalairport}</span> departs from <span style='color:#0b1560;'>${us.airport}</span> at<span style='color:#0b1560;'>${departureTime1}</span></p><div className="flight-time" style='padding: 2rem 0;margin:auto; @media screen and (max-width:640px) {.flight-time{flex-direction: column; }}'>
                                <div className="from"><p>From</p><h5 className="date" style='text-align: center;padding:0;margin:.5rem;font-weight: 6rem;font-size: 1.5rem;'>${departureTime1}</h5><h5 className="time"style=' text-align: center;padding:0;margin:.5rem;font-weight: 6rem;font-size: 1.5rem;'>${data.legs[0].departureDateTime}</h5></div><div className="to"><p>To</p><h5 className="date" style=' text-align: center;padding:0;margin:.5rem;font-weight: 6rem;font-size: 1.5rem;'>${arrivalTime1}</h5><h5 className="time" style=' text-align: center;padding:0;margin:.5rem;font-weight: 6rem;font-size: 1.5rem;'>${data.legs[0].arrivalDateTime}</h5></div></div><div className="flight-footer-section" style='padding-bottom: 2rem;'><p>Flight Duration:${duration1}</p><p>Travel Category: Economy</p></div></div></div>`

                            }
                            /////////////////

                            if (data.legs[1] != null) {
                                let airlineCode2 = "";
                                for (var i = 0; i < data.legs[1].airlineCodes.length; i++) {
                                    airlineCode2 = airlineCode2 + `${data.legs[1].airlineCodes[i]}  `
                                }
                                let departureTime2 = data.legs[1].departureTime;
                                let arrivalTime2 = data.legs[1].arrivalTime;
                                let duration2 = data.legs[1].duration;
                                let segment2 = "";
                                for (var i = 0; i < data.legs[1].segments.length; i++) {
                                    segment2 = segment2 + `${data.legs[1].segments[i].arrivalAirportCode}  `
                                }
                                html2 = `<div className="outer-flight-div" style='max-width: 100vw;'><div className="flight-section" style='width:60%;background-color: blue;margin:auto;@media screen and (max-width:640px) {.flight-section{width:80%;}}'><h1 style='text-align: center;margin-top: 2rem;padding-top:4rem;@media screen and (max-width:640px) {h1{text-align: center;margin-top: 2rem;padding-top:3rem;}}'>FLIGHTS AVAILABLE</h1><p style='margin-top: 2rem;text-align: center;font-size: 1.2rem;font-weight: 600;@media screen and (max-width:640px) { .flight-section p{margin:1.2rem}}'>Your first flight from <span style='color:#0b1560;'>${us.airport}</span> to <spanstyle='color:#0b1560;'>${us.arrivalairport}</span> departs from <span style='color:#0b1560;'>${us.airport}</span> at<span style='color:#0b1560;'>${departureTime2}</span></p><div className="flight-time" style='padding: 2rem 0;margin:auto; @media screen and (max-width:640px) {.flight-time{flex-direction: column; }}'>
                                <div className="from"><p>From</p><h5 className="date" style='text-align: center;padding:0;margin:.5rem;font-weight: 6rem;font-size: 1.5rem;'>${departureTime2}</h5><h5 className="time"style=' text-align: center;padding:0;margin:.5rem;font-weight: 6rem;font-size: 1.5rem;'>${data.legs[1].departureDateTime}</h5></div><div className="to"><p>To</p><h5 className="date" style=' text-align: center;padding:0;margin:.5rem;font-weight: 6rem;font-size: 1.5rem;'>${arrivalTime2}</h5><h5 className="time" style=' text-align: center;padding:0;margin:.5rem;font-weight: 6rem;font-size: 1.5rem;'>${data.legs[1].arrivalDateTime}</h5></div></div><div className="flight-footer-section" style='padding-bottom: 2rem;'><p>Flight Duration:${duration2}</p><p>Travel Category: Economy</p></div></div></div>`

                            }
                            //////////////////
                            if (data.legs[2] != null) {
                                let airlineCode3 = "";
                                for (var i = 0; i < data.legs[2].airlineCodes.length; i++) {
                                    airlineCode3 = airlineCode3 + `${data.legs[2].airlineCodes[i]} `
                                }
                                let departureTime3 = data.legs[2].departureTime;
                                let arrivalTime3 = data.legs[2].arrivalTime;
                                let duration3 = data.legs[2].duration;
                                let segment3 = "";
                                for (var i = 0; i < data.legs[2].segments.length; i++) {
                                    segment3 = segment3 + `${data.legs[2].segments[i].arrivalAirportCode}  `
                                }

                                html3 = `<div className="outer-flight-div" style='max-width: 100vw;'><div className="flight-section" style='width:60%;background-color: blue;margin:auto;@media screen and (max-width:640px) {.flight-section{width:80%;}}'><h1 style='text-align: center;margin-top: 2rem;padding-top:4rem;@media screen and (max-width:640px) {h1{text-align: center;margin-top: 2rem;padding-top:3rem;}}'>FLIGHTS AVAILABLE</h1><p style='margin-top: 2rem;text-align: center;font-size: 1.2rem;font-weight: 600;@media screen and (max-width:640px) { .flight-section p{margin:1.2rem}}'>Your first flight from <span style='color:#0b1560;'>${us.airport}</span> to <spanstyle='color:#0b1560;'>${us.arrivalairport}</span> departs from <span style='color:#0b1560;'>${us.airport}</span> at<span style='color:#0b1560;'>${departureTime3}</span></p><div className="flight-time" style='padding: 2rem 0;margin:auto; @media screen and (max-width:640px) {.flight-time{flex-direction: column; }}'>
                            <div className="from"><p>From</p><h5 className="date" style='text-align: center;padding:0;margin:.5rem;font-weight: 6rem;font-size: 1.5rem;'>${departureTime3}</h5><h5 className="time"style=' text-align: center;padding:0;margin:.5rem;font-weight: 6rem;font-size: 1.5rem;'>${data.legs[2].departureDateTime}</h5></div><div className="to"><p>To</p><h5 className="date" style=' text-align: center;padding:0;margin:.5rem;font-weight: 6rem;font-size: 1.5rem;'>${arrivalTime3}</h5><h5 className="time" style=' text-align: center;padding:0;margin:.5rem;font-weight: 6rem;font-size: 1.5rem;'>${data.legs[2].arrivalDateTime}</h5></div></div><div className="flight-footer-section" style='padding-bottom: 2rem;'><p>Flight Duration:${duration3}</p><p>Travel Category: Economy</p></div></div></div>`
                            }

                            if (data.legs[0] == null && data.legs[1] == null && data.legs[2] == null) {
                                html1 = "<h1 style='font-weight:bold'>Flights Not Available</h1>"
                                html2 = ""
                                html3 = ""
                            }
                            else if (data.legs[0] != null && data.legs[1] == null && data.legs[2] == null) {

                                html2 = ""
                                html3 = ""
                            }
                            else if (data.legs[0] != null && data.legs[1] != null && data.legs[2] == null) {

                                html3 = ""
                            }
                            else if (data.legs[0] == null && data.legs[1] != null && data.legs[2] == null) {

                                html1 = ""
                                html3 = ""
                            }
                            else if (data.legs[0] == null && data.legs[1] == null && data.legs[2] != null) {

                                html2 = ""
                                html1 = ""
                            }
                            else if (data.legs[0] != null && data.legs[1] == null && data.legs[2] != null) {

                                html2 = ""
                            }
                            else if (data.legs[0] == null && data.legs[1] != null && data.legs[2] != null) {

                                html2 = ""
                            }



                            var mailOptions = {
                                from: '<joeymercury497@gmail.com>',
                                to: us.email,//email to be sended
                                subject: "FLIGHTS_INFOMATION  ",
                                html: html0 + html1 + html2 + html3 + html4  // html body
                            };
                            transporter.sendMail(mailOptions, (error, info) => {
                                if (error) {
                                    return console.log(error);
                                }
                                console.log('Message sent: %s', info.messageId);
                                console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                            });
                        }
                    });
                }

                );
            }
        }
    });
});

app.use(express.static("flightui/build"));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '/flightui/build', 'index.html'));
});

app.listen(port, function (err) {

    connect();
    console.log("connect to backend");
})
