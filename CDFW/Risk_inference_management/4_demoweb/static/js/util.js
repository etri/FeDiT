// Add (or substract if value is negative) the value, expresed in timeUnit
// to the date and return the new date.
// ex1) add_10_minutes_to_current_date = Date.dateAdd( Date(), 10, "m");
// ex2) subs_1_hour_to_a_date = Date.dateAdd( date_value, -1, "h");
Date.dateAdd = function (currentDate, value, timeUnit) {
    timeUnit = timeUnit.toLowerCase();
    var multiplyBy = {
        w: 604800000,
        d: 86400000,
        h: 3600000,
        m: 60000,
        s: 1000
    };
    var updatedDate = new Date(currentDate.getTime() + multiplyBy[timeUnit] * value);
    return updatedDate;
};