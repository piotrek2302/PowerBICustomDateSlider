export class YearMonth {
    year: number;
    month: number;

    constructor (yearMonthString: string) {
        const[year, month] = yearMonthString.split("-")
        this.year = parseInt(year);
        this.month = parseInt(month);

    }

    //increments month by 1, if 12 (desember) increment year
    public incrementMonth() {
        if (this.month == 12) {
            this.month = 1
            this.year++;
        }

        else {
            this.month++;
        }
    }

    public toString() {
        const paddedMonth = this.month.toString().padStart(2, "0");
        return this.year + "-" + paddedMonth;
    }

    public greaterThanOrEqualTo(other: YearMonth) {
        if (this.year > other.year) {
            console.log("minyear greater than maxyear")
            return true
        }

        if (this.year < other.year) {
            console.log("minyear smaller than maxyear")
            return false
        }

        /// years are equal
        console.log("months are equal")
        console.log(this.month, other.month)
        return this.month >= other.month 
    }

    public formatDate() {
        console.log("formatDate()")
        const dateToFormat: Date = new Date(this.year, this.month-1);
        let formattedDate = "";
        //reading date and formatting it to string
        //date format example "2024 jan"
        const dateFormat: Intl.DateTimeFormatOptions = {
            year: "numeric",
            month: "short"
        }
    
        formattedDate = dateToFormat.toLocaleDateString("en-US", dateFormat);
        return formattedDate;
    }
    
}