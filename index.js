
const { json } = require('body-parser')
const csv = require('csv-parser')
const fs =  require('fs')
const _ = require('lodash')
const libphone = require('libphonenumber-js')

var results = []

const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

function deepDifference(object, base) {
	function changes(object, base) {
		return _.transform(object, function(result, value, key) {
			if (!_.isEqual(value, base[key])) {
				result[key] = (_.isObject(value) && _.isObject(base[key])) ? changes(value, base[key]) : value;
			}
		});
	}
	return changes(object, base);
}
var isEmailOrPhone = (key) => {
    if(key.startsWith('email'))return 'email';
    if(key.startsWith('phone'))return 'phone';
}
var finalResult = []

fs.createReadStream('input.csv')
    .pipe(csv({}))
    .on('data', (data)=>{
    results.push(data)
    return results;
    })
    .on('end', function(){
     _.forIn(results, (studentInfos) =>{
         //proto
        var emails = _.pickBy(studentInfos, function(value, key) {
            if(_.startsWith(key, "email")){
            return validateEmail(value)
            }             
        })
        var phones = _.pickBy(studentInfos, (value, key) => {
            if(_.startsWith(key, "phone")){
                return libphone.isPossiblePhoneNumber(value, "BR")                  
            }
        })
        var data = []
        var mergedContactForms = _.merge(emails, phones)
        _.forIn(mergedContactForms, (value, key) =>{
            tagTypes = (key) =>_.split(key, " ", 3);           
            var formattedContent =  _.create({address: [], tags: [], type: []},
            {
                address: [value],
                type: isEmailOrPhone(key),
                tags:tagTypes(key).splice(1)
            })
            data.push(formattedContent)
        })
        var differenceBetweenObj  = deepDifference(_.pickBy(studentInfos, (value, key)=>{
            if((value && key) !== ''  && isEmailOrPhone(key) !== ('phone' || 'email')){
                return key
        }}), mergedContactForms)
        var newResults =[_.merge([...data], [differenceBetweenObj])]
        finalResult.push([newResults])
    }) 
    fs.writeFile("./output.json", JSON.stringify(finalResult, null, 4), (err) => {
        if (err) {  console.error(err);  return; };
        console.log("File has been created");
    });
})