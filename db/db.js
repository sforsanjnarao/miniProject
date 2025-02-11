const mongoose = require('mongoose')

const connect = ()=>{
    try {
        mongoose.connect("mongodb://localhost:27017/miniProject")
        .then(()=>{
            console.log("database connected")
        })
    } catch (error) {
        console.log("database not connected", error)
    }
}

module.exports = connect