let Hashmap = require('hashmap');
class Candidate {
    constructor(index, start, end) {
        this.index = index;
        this.start = start;
        this.end = end;
        this.isChain = false;
    }
}

class ASTParser {
    constructor(code, stmts) {
        this.candidates = this.getCandidates(code, stmts);
        this.result = chainingHandler(this.candidates, stmts);
    }

    getCandidates(code, stmts) {
        let esprima = require('esprima');
        let ast = esprima.parse(code, {loc: true});
        let candidates = [];
        let estraverse = require('estraverse');
        estraverse.traverse(ast, {
            enter: function (node) {
                console.log(node);
                let candidate = filter(node, stmts);
                if (candidate != null) {
                    candidates.push(candidate);
                }
            }
        });
        return candidates;
    };
}

/**
 * find out the chaining call in an expression, removing the redundant expression if there is only one chaining call
 * @param {Candidate[]}candidates candidate expressions found in AST
 * @param {Stmt[]}stmts
 * @returns {Array}
 */
function chainingHandler(candidates, stmts) {
    let expressions = new Hashmap();
    let res = [];
    for (let i in candidates) {
        let tmp = candidates[i];
        let tmpIdx = tmp.index;
        if (expressions.get(tmp.index)) {
            expressions.get(tmpIdx).push(candidates[i]);
        } else {
            expressions.set(tmpIdx, [candidates[i]]);
        }
    }
    let val = expressions.values();
    for (let i in val) {
        let tmpMap = new Hashmap();
        for (let k in val[i]) {
            let key = val[i][k].start;
            let value = val[i][k].end;
            if (tmpMap.get(key)) {
                tmpMap.get(key).push(value);
            } else {
                tmpMap.set(key, [value]);
            }
        }
        tmpMap.forEach(function (value, key) {
            let v = value.sort();
            let prev = "", prevIdx = 0;
            for (let k in v) {
                let current = stmts[val[i][0].index - 1].code.substring(key, v[k]);
                if (prev.length === 0) {
                    prev = current;
                    prevIdx = k;
                } else {
                    let surffix = current.substring(prev.length);
                    if (surffix.indexOf('.') < 0) { // that means prev should be removed
                        prev = current;
                        delete v[prevIdx];
                        prevIdx = k;
                    } else {
                        prev = current;
                        prevIdx = k;
                    }
                }
            }
            if (v.length === 2) {
                let max = v[0] > v[1] ? v[0] : v[1];
                let maxRes = new Candidate(val[i][0].index, key, [max]);
                res.push(maxRes);
            } else {
                let prev = key; // chain[0,1) represents the current non-function-call string
                for (let k in v) { //todo: check if the statements are function calls
                    if(k==0){
                        let tmpCode = stmts[val[i][0].index-1].code.substring(prev, v[k]);
                        if(tmpCode.indexOf('(')>0){
                            let tmpRes = new Candidate(val[i][0].index, key, [v[k]]);
                            tmpRes.isChain = v.length>2;
                            res.push(tmpRes);
                        }else{
                            if(k!= v.length-1){
                                let tmpRes = new Candidate(val[i][0].index, key, []);
                                tmpRes.isChain = v.length>2;
                                res.push(tmpRes);
                            }else{
                                let tmpRes = new Candidate(val[i][0].index, key, [v[k]]);
                                tmpRes.isChain = v.length>2;
                                res.push(tmpRes);
                            }

                        }
                        prev = v[k];
                    }else{
                        let tmpCode = stmts[val[i][0].index-1].code.substring(prev, v[k]);
                        if(tmpCode.indexOf('(')>0){
                            res[res.length-1].end.push(v[k]);
                        }else{
                            if(k== v.length-1){
                                res[res.length-1].end.push(v[k]);
                                res[res.length-1].isChain = res[res.length-1].end.length>1;
                            }
                        }
                        prev = v[k];
                    }
                }
            }
        });
    }
    print(stmts,res);
    return groupByIndex(res);
}

/**
 * @description return the statement which satisfies the requirement: the type of this expression is either FunctionCall or MemberExpression
 * @param {object}node the AST node
 * @param {Stmt[]}stmts the statements of the js file
 */
function filter(node, stmts) {
    let type = node.type;
    let isCandidate = (type === 'CallExpression') || (type === 'MemberExpression');
    if (isCandidate) {
        let startLine = node.loc.start.line;
        let endLine = node.loc.end.line;
        if (startLine === endLine) {
            let startRow = node.loc.start.column;
            let endRow = node.loc.end.column;
            if (isLegal(stmts[startLine - 1].code, startRow, endRow - 1)) {
                let candidate = new Candidate(startLine, startRow, endRow);
                return candidate;
            }
        } else {
            return null;
        }
    } else {
        return null;
    }
}

function isLegal(stmt, start, end) {
    let accept = true;
    if (end < stmt.length - 1) {
        let next = end + 1;
        while (next < stmt.length) {
            if (stmt[next] === ' ') {
                ++next;
            } else {
                if (stmt[next] == '{' || stmt[next] == '(') {
                    accept = false;
                }
                break;
            }
        }
    } else {
        if (stmt[end] == '{' || stmt[end] == '(') {
            accept = false;
        }
    }
    return accept;

}

function groupByIndex(candidates){
    let groups = new Hashmap();
    for(let i in candidates){
        let idx = candidates[i].index;
        if(groups.get(idx)){
            groups.get(idx).push(candidates[i]);
        }else{
            groups.set(idx, [candidates[i]]);
        }
    }
    return groups;
}

function print(stmts,res){
    for(let k in res){
        for(let i in res[k].end){
           console.log(stmts[res[k].index-1].code.substring(res[k].start,res[k].end[i]));

        }
    }


}
module.exports = ASTParser;