import 'http://code.jquery.com/jquery-3.3.1.min.js';
let record = [];
let a = [$('div'),2,3];
let b = '$(a)';
CI($(a)).each(function (){
    console.log(this);
});

console.log(record);



function CI(code){
    let res = eval(code);
    record.push('line:'+1+' isIns:'+(res instanceof $));
    return res;
    // console.log(res instanceof $);
}