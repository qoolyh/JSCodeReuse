class Statement{
    // constructor( stmtStr,stmtRes,lineNum,isDom, isChain, start){
    //     this.stmtStr = stmtStr;
    //     this.stmtRes = stmtRes;
    //     this.lineNum = lineNum;
    //     this.isDom = isDom;
    //     this.isChain = isChain;
    //     this.start = start;
    //     this.isBlockStart = false;
    //     this.isBlockEnd = false;
    //     this,level = 0;
    // }
    constructor(){
        this.stmtStr = "";
        this.lineNum = 0;
        this.isDom = false;
        this.isChain = false;
        this.start = 0;
        this.isBlockStart = false;
        this.isBlockEnd = false;
        this.level = 0;
        this.isAssign = 0;
        this.chainCallIdx= [];
    }
}

module.exports = Statement;