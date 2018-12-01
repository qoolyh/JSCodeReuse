let FormatUtil = require('./FormatUtil.js');
let ASTParser = require('./ASTParser.js');
main('reg.js');

function main(filePath){
    // reading the file and format, which includes: 1) beautify the code, and 2) parse the code to a set of statement objects.
    let formattedCode = new FormatUtil(filePath);
    let stmts = formattedCode.stmts; //
    let toBeParsedCode = "";
    for(let i=0;i<stmts.length;i++){
        toBeParsedCode+=stmts[i].code+"\n";
    }

    // parse the formatted code to AST, find out the candidate statements that may contain DOM-accesses.
    let ast = new ASTParser(toBeParsedCode,stmts);
    let candidates = ast.result; // now we get the candidates

    // generate the temporal instrumented code to monitor the running result of the candidate
    // for(let i in candidates){
    //     let idx = candidates[i].index-1;
    //     let toBeInsCode = stmts[idx].code.substring(candidates[i].start, candidates[i].end);
    //     instrument();
    // }

    candidates.forEach(function(value, key){
        let idx = key;
        let toBeInsCode = stmts[idx-1].code;
        // instrumentation(toBeInsCode, value);
    });
    //
    // for(let i in candidates){
    //     // console.log(i+' '+res[i]);
    //     let idx = candidates[i].index-1;
    //     console.log(stmts[idx].code.substring(candidates[i].start, candidates[i].end)+' chaining:'+candidates[i].isChain);
    //     // doCodeIns(stmts,idx); // record the candidate statements' running results to see if they are HTMLElement.
    // }
    //
    // let instrumentedCode = "";
    // for(let i=0;i<stmts.length;i++){
    //     instrumentedCode+=stmts[i].code+"\n";
    // }
    // replace the original js code with the instrumented code.
}

/**
 *
 * @param {string}stmt
 * @param {Candidate[]}candidates
 */
function instrumentation(stmt, candidates) {
    let tmp = stmt,
        prev = -1,
        max = 0,
    result = '';
    for(let i in candidates){
        if(candidates[i].isChain === false){
            let prev = 0;
            for(let k in candidates[i].end){

            }
            let toBeReplaced = stmt.substring(candidates[i].start, candidates[i].end);
            let replaced = 'CI('+toBeReplaced+')'; // todo: special handle with chaining
            result = stmt.substring(0, candidates[i].start)+ replaced;
        }else{

        }
    }
}

