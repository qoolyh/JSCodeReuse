class Stmt {
    constructor(code, lineNum, annotation) {
        this.code = code;
        this.annotation = annotation;
        this.paras = [];
        this.argus = [];
        this.test = [];
        this.lineNum = lineNum;
        this.chain = '';
        this.operator = [];
        this.value = '';
        this.update = '';
        this.left = [];
        this.right = [];
        this.isChain = false;
    }
}

class FormatUtil {
    constructor(url) {
        let tmp_stmts = this.beautifier(url);
        this.stmts = this.bindAnnotation(tmp_stmts);
        // let result = this.removeAnnotation(url);
        // this.code = result[0];
        // //console.log(this.code);
        // let strs = result[1];
        // let stmts = [];
        // stmts.push(null);
        // for(let i=0;i<strs.length;i++){
        //     let stmt = new Stmt(strs[i],i+1);
        //     stmts.push(stmt);
        // }
        // for(let i =1;i<stmts.length;i++){
        //     let chain = this.chainCallhandler(stmts[i].code);
        //     if(chain.length>0){
        //         stmts[i].chain = chain;
        //     }
        // }
        // this.astHandler(result[0],stmts);
        // this.stmts = stmts;

    }

    /**
     * Remove the blank lines and annotations in the JS code
     **/
    removeAnnotation(url) {
        let result = [];
        let beautify = require('js-beautify').js_beautify,
            fs = require('fs');
        let data = fs.readFileSync(url, 'utf8');
        let code = beautify(data, {indent_size: 2});
        let annoIdf = 0;
        let stmts = code.split('\r\n');
        for (let i = 0; i < stmts.length; i++) {
            if (annoIdf > 0) {
                if (contains(stmts[i], '*/')) {
                    --annoIdf;
                }
                stmts[i] = "";
            } else {
                if (contains(stmts[i], '//') && notInQuote(stmts[i], stmts[i].indexOf('//'))) {
                    stmts[i] = stmts[i].substring(0, stmts[i].indexOf('//'));
                } else if (contains(stmts[i], '/*') && notInQuote(stmts[i], stmts[i].indexOf('/*'))) {
                    ++annoIdf;
                    stmts[i] = stmts[i].substring(0, stmts[i].indexOf('/*'));
                } else {
                    stmts[i] = stmts[i].indexOf('\r') >= 0 ? stmts[i].substring(0, stmts[i].indexOf('\r')) : stmts[i];
                }
            }
            let reg = /^[ ]+$/;
            if (reg.test(stmts[i])) {
                stmts[i] = '';
            }
        }
        let res = '', resStmt = [];
        for (let i = 0; i < stmts.length; i++) {
            if (stmts[i].length > 0) {
                res = res + stmts[i];
                resStmt.push(stmts[i]);
            }
        }
        result.push(res);
        result.push(resStmt);
        return result;
    }

    /**
     * calling js-beautify to format the source code
     * @param url The location of the source code
     * @returns The formatted code
     */
    beautifier(url) {
        let result = [];
        let beautify = require('js-beautify').js_beautify,
            fs = require('fs');
        let data = fs.readFileSync(url, 'utf8');
        let code = beautify(data, {indent_size: 2});
        let stmts = code.split('\n');
        let reg = /^\s*$/;
        for(let i=0;i<stmts.length;i++){
            if (reg.test(stmts[i])) {
                delete stmts[i];
            }
        }
        return stmts;
    }

    /**
     * binding the annotation to the nearest statement
     * @param code
     */
    bindAnnotation(stmts) {
        let statements = [];
        let annoIdf = 0;
        let annotation = [];
        for (let i = 0; i < stmts.length; i++) {
            if(stmts[i]=== undefined){
                continue;
            }
            if (annoIdf > 0) {
                if (contains(stmts[i], '*/')) {
                    --annoIdf;
                }
                annotation.push(stmts[i] + '\n');
            } else {
                // in case of '//'
                if (contains(stmts[i], '//') && notInQuote(stmts[i], stmts[i].indexOf('//'))) {
                    if (stmts[i].indexOf('//') > 0) {
                        let prev = stmts[i].substring(0, stmts[i].indexOf('//'));
                        let reg = /^[ ]+$/;
                        if (reg.test(prev)) {
                            annotation.push(stmts[i] + '\n');
                        }
                        //egnore
                    } else {
                        //bind to the nearest stmt
                        annotation.push(stmts[i] + '\n');
                    }
                } else if (contains(stmts[i], '/*') && notInQuote(stmts[i], stmts[i].indexOf('/*'))) {
                    ++annoIdf;
                    annotation.push(stmts[i] + '\n');
                } else {
                    stmts[i] = stmts[i].indexOf('\r') >= 0 ? stmts[i].substring(0, stmts[i].indexOf('\r')) : stmts[i];
                    let tmp_stmt = new Stmt(stmts[i], i,{...annotation}); // {...object} is a deep clone in ES6

                    statements.push(tmp_stmt);
                    if (annotation.length > 0) {
                        annotation.splice(0, annotation.length);
                    }
                }
            }
            let reg = /^[ ]+$/;
            if (reg.test(stmts[i])) {
                stmts[i] = '';
            }
        }
        return statements;
    }

    chainCallhandler(stmt) {
        let cnCall = [];
        let cnIdx = indexOf(stmt, '.');
        if (cnIdx.length > 0) {
            for (let i = 0; i < cnIdx.length; i++) {
                if (notInQuote(stmt, cnIdx[i])) {
                    cnCall.push(cnIdx[i]);
                }
            }
        }
        let chainCalls = [];
        for (let i = 0; i < cnCall.length; i++) {
            chainCalls.push(stmt.substring(0, cnCall[i]));
        }
        chainCalls.push(stmt);
        return chainCalls;
    }

    // astHandler(code, stmts) {
    //     let esprima = require('esprima');
    //     let estraverse = require('estraverse');
    //     let ast = esprima.parse(code, {loc: true});
    //     estraverse.traverse(ast, {
    //         enter: function (node) {
    //             console.log(node);
    //             update(node, stmts);
    //         }
    //     });
    // }
}

 // main();
(function test(){
    let url = 'reg.js';
    let beautify = require('js-beautify').js_beautify,
        fs = require('fs');
    let data = fs.readFileSync(url, 'utf8');
    let code = beautify(data, {indent_size: 2});
    let esprima = require('esprima');
    let ast = esprima.parse(code, {loc: true});
    let layerInfo = [13], endInfo = [13];
    let layer = 0;
    let estraverse = require('estraverse');
    const controlFlowArray = ['IfStatement',
        'WhileStatement', 'DoWhileStatement', 'ForInStatement', 'ForStatement',
        'TryStatement'];
    const blockWithADeeperLayer = controlFlowArray.concat(['FunctionExpression', 'FunctionDeclaration', 'CatchClause']);
    function record(node){

        const innerBlock = node.body || node.consequent || node.cases;
        // Assign block's wrapper to the higher layer
        // layerInfo[node.loc.start.line - 1] = layerInfo[node.loc.start.line - 1] ===-1? layer - 1:layerInfo[node.loc.start.line - 1] + 0.1;
        // layerInfo[node.loc.end.line - 1] = layerInfo[node.loc.end.line - 1] === -1? layer - 1:layerInfo[node.loc.end.line - 1]+0.1;
        layerInfo[node.loc.start.line - 1] =  layer - 1;
        endInfo[node.loc.start.line - 1] = node.loc.end.line-1 ;
        layerInfo[node.loc.end.line - 1] = layer - 1;
        if (innerBlock.length > 0) {
            const start = innerBlock[0].loc.start.line;
            const end = innerBlock[innerBlock.length - 1].loc.end.line;
            for (let i = start; i <= end; ++i) {
                layerInfo[i - 1] = layer;
            }
        }
    }
    estraverse.traverse(ast, {
        enter: function(node, parent){
            const nodeType = node.type;
            if (nodeType === 'SwitchCase' || nodeType === 'SwitchStatement') {
                // Switch case
                // print('Switch', node.loc.start.line, node.loc.end.line);
                ++layer;
                record(node);
            }
            else if (nodeType === 'BlockStatement') {
                // print('Block', node.loc.start.line, node.loc.end.line);
                if (parent && parent.type) {
                    const parentType = parent.type;
                    if (blockWithADeeperLayer.indexOf(parentType) !== -1) {
                        if (node.body.length !== 0) {
                            ++layer;
                            record(node);
                        }
                    }
                }
            }
            else if (node.loc.start.line === node.loc.end.line) {
                const line = node.loc.start.line;
                layerInfo[line - 1] = layer;
            }
        },
        leave: function(node, parent){
            const nodeType = node.type;
            if (nodeType === 'SwitchCase') {
                // Switch case
                --layer;
            }
            if (node.type === 'BlockStatement') {
                if (parent && parent.type) {
                    const parentType = parent.type;
                    if (blockWithADeeperLayer.indexOf(parentType) !== -1) {
                        if (node.body.length !== 0) {
                            --layer;
                        }
                    }
                }
            }
        }
    });
    // console.log(layerInfo);
    // console.log(endInfo);
    let msg = "";
    for(let i in layerInfo){
        msg+=layerInfo[i]+':'+endInfo[i]+" ";
    }
    // console.log(msg);
    let str = msg.split(' ');
    // console.log(str);
    for(let s in str){
        let tmp = str[s].split(':');
        console.log(tmp)
    }
   //  let total = '';
   //  for(let i=1;i<stmts.length;i++){
   //      let lineNum = i;
   //      let stmt = stmts[i];
   //      let final = '';
   //      if(stmt.operator.length===0 || stmt.update.length ===0){
   //          let toBeExe = stmt.code;
   //          if(isLegal(toBeExe,esprima)){
   //              final = 'console.log('+lineNum+'\' \'+isDOM('+toBeExe+'));';
   //          }
   //      }else if(stmt.update.length>0){
   //              let toBeExe = stmt.code;
   //              let prev = (stmt.update === '++'?'--':'++')+stmt.value;
   //              final = prev+'console.log('+lineNum+'\' \'+isDOM('+toBeExe+'));';
   //      }else if(stmt.operator.length>0){
   //
   //      }
   //  }
   //  for(let i=1;i<fu.stmts.length;i++){
   //      let tmp = fu.stmts[i];
   //      if(tmp.left && tmp.left.length>0){
   //          console.log('---line='+tmp.lineNum+' code='+tmp.code);
   //          for(let k=0;k<tmp.left.length;k++){
   //              console.log('left:'+tmp.code.substring(tmp.left[k][0], tmp.left[k][1]));
   //          }
   //      }
   //      if(tmp.right && tmp.right.length>0){
   //          for(let k=0;k<tmp.right.length;k++){
   //              console.log('right:'+tmp.code.substring(tmp.right[k][0], tmp.right[k][1]));
   //          }
   //      }
   //  }
   // console.log(fu.stmts);

})();


function stmthandler(stmt, esprima, msg) {
    //$(id).click(function(){
    // });
    if (stmt.operator.length === 0 || stmt.update.length === 0) {
        let toBeExe = stmt.code;
        if (toBeExe.indexOf('$') >= 0) {
            let chain = stmt.chain;
            for (let i = 0; i < chain.length; i++) {
                if (isLegal(chain[i], esprima)) {
                    chain[i] = chain[i].indexOf(';') > 0 ? chain[i].substring(0, chain[i].indexOf(';')) : chain[i];
                    msg += 'console.log(' + chain[i] + '+\' \'+' + lineNum + '+\' \'+isDOM(' + toBeExe + '));';
                }
            }
        }

    } else if (stmt.update.length > 0) {
        let toBeExe = stmt.code;
        let prev = (stmt.update === '++' ? '--' : '++') + stmt.value;
        final = prev + ';\n console.log(' + lineNum + '\' \'+isDOM(' + toBeExe + '));';
    } else if (stmt.operator.length > 0) {
        let left = stmt.left;
        let right = stmt.right;

        let leftStr = stmt.substring(left.loc.start.column, left.loc.start.column);
        stmthandler(left, esprima, msg);
        stmthandler(right, esprima, msg);
    }
}

function isLegal(stmt, esprima) {
    try {
        esprima.parse(stmt);
        return true;
    }
    catch (err) {
        return false;
    }
}

function notIn(value, array) {
    let notIn = true;
    for (let i = 0; i < array.length; i++) {
        if ((value[0] >= array[i][0] && value[0] <= array[i][0]) || (value[1] >= array[i][1] && value[1] <= array[i][1])) {
            notIn = false;
            break;
        }
    }
    return notIn;
}

/**
 *
 * @param node
 * @param stmts
 */
function update(node, stmts) {
    let status = 0,
        lineNum = 0;
    if (node.operator !== undefined) {
        let lineNum = node.loc.start.line;
        //  console.log('num='+lineNum+' opt:'+node.operator);
        if (node.type === 'UpdateExpression') {
            stmts[lineNum].update = node.operator;
            stmts[lineNum].value = node.type === 'Identifier' ? node.name : node.value;
        } else {
            let optInfo = [node.operator, node.loc.start.column, node.loc.end.column];
            stmts[lineNum].operator.push(optInfo);
            let left = [], right = [];
            if (node.left.loc.start) {
                left.push(node.left.loc.start.column);
                left.push(node.left.loc.end.column);
            }
            if (node.right.loc.start) {
                right.push(node.right.loc.start.column);
                right.push(node.right.loc.end.column);
            }
            if (notIn(left, stmts[lineNum].left) && left.length > 0) {
                stmts[lineNum].left.push(left);
            }
            if (notIn(right, stmts[lineNum].right) && right.length > 0) {
                stmts[lineNum].right.push(right);
            }

        }
    }
    if (node.type.indexOf('Function') >= 0) {
        status = 1;
    } else if (node.type.indexOf('Call') >= 0) {
        status = 2;
    } else if (node.test !== undefined) {
        status = 3;
    }
    switch (status) {
        case 1:
            let paras = node.params;
            for (let i = 0; i < paras.length; i++) {
                if (paras[i].loc && (paras[i] === 'Identifier' || paras[i] === 'Literal')) {
                    lineNum = paras[i].loc.start.line;
                    stmts[lineNum].paras.push(paras[i]);
                }
            }
            break;
        case 2:
            let args = node.arguments;
            for (let i = 0; i < args.length; i++) {
                if (args[i].loc && (args[i] === 'Identifier' || args[i] === 'Literal')) {
                    lineNum = args[i].loc.start.line;
                    stmts[lineNum].argus.push(args[i]);
                }
            }
            break;
        case 3:
            let test = node.test;
            //console.log(node.test);
            if (test.loc) {
                lineNum = test.loc.start.line;
                stmts[lineNum].test.push(test);
            }

            break;
        default:
            break;
    }

}

function main() {
    let js_url = './DOMChecker.js';
    var beautify = require('js-beautify').js_beautify,
        fs = require('fs');
    var parser = [];
    var Statement = require('./Statement');
    var data = fs.readFileSync(js_url, 'utf8');
    let tmpSingle = "";
    let lv = 0;
    let res = beautify(data, {indent_size: 2});
    let FU = new FormatUtil();
    //console.log(res);
    let tmp = FU.removeAnnotation(res);
    let str = 'a.b.c().s(\'.cls\')';

    console.log(FU.chainCallhandler(str));
}

function indexOf(str, substr) {
    let idx = [];
    let prev = 0;
    while (str.indexOf(substr) >= 0) {
        let tmp = str.indexOf(substr);
        idx.push(prev + tmp);
        prev += tmp + substr.length;
        str = str.substr(tmp + substr.length);
    }
    return idx;
}

function notInQuote(str, idx) {
    let left = str.substring(0, idx);
    let sQuote = countChar(left, '\'');
    let dQuote = countChar(left, '"');
    let notIn = sQuote % 2 === 0 && dQuote % 2 === 0;
    return notIn;

}

function contains(str, substr) {
    let contain = false;
    if (str.indexOf(substr) !== -1) {
        let left = str.substring(0, str.indexOf(substr));
        let right = str.substring(str.indexOf(substr) + substr.length);
        if (left.length === 0) {
            contain = true;
        } else if (countChar(left, substr) % 2 === 0) {
            contain = true;
        }
    }
    return contain;
}

function countChar(str, ch) {
    let num = 0;
    for (let i = 0; i < str.length; i++) {
        if (str.charAt(i) === ch) {
            ++num;
        }
    }
    return num;
}

function clone(obj) {
    let o;
    if (typeof obj === "object") {
        if (obj === null) {
            o = null;
        } else {
            if (obj instanceof Array) {
                o = [];
                for (let i = 0, len = obj.length; i < len; i++) {
                    o.push(clone(obj[i]));
                }
            } else {
                o = {};
                for (let j in obj) {
                    o[j] = clone(obj[j]);
                }
            }
        }
    } else {
        o = obj;
    }
    return o;
}
module.exports = FormatUtil;

