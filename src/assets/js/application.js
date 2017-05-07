var moment = require('moment');
let utility = require('utility');
import Children from 'person';
import {
    work,
    Person
} from 'person';


var edgar = new Children('Edgar');
console.log(edgar.doWork());

console.log(work('Andrea'));



console.log(window)
console.log(utility.square(7))
console.log(moment().format('LLLL'))

window.onload = function () {

    console.log('Hi!!')

}