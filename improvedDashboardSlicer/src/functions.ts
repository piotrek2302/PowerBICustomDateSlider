import powerbi from "powerbi-visuals-api";
import DataView = powerbi.DataView;
import{AdvancedFilter,IAdvancedFilterCondition,IFilterColumnTarget} from "powerbi-models";
import {YearMonth} from "./yearmonth";

export function makeMinMaxDatesArray(startDateString: string, endDateString: string) {
    console.log("inside makeMinMaxDatesArray()")

    const startDate = new YearMonth(startDateString);
    const endDate = new YearMonth(endDateString);
    //console.log("object ym =", startDate.toString())
    //ym1.incrementMonth()
    //console.log("ym increment month =",ym1.toString())
    //console.log("greaterThanEqualto test", startDate.greaterThanOrEqualTo(endDate))
    
    let minMaxDates: string[] = [startDate.toString()];
    let current: YearMonth = startDate;

    while(true) {
        if(current.greaterThanOrEqualTo(endDate)) {
            break
        }

        current.incrementMonth()
        minMaxDates.push(current.toString())

    }
    //returns the array
    return minMaxDates;

}


//used to fill the range between thumbs with appropriate color initially and on each slider move. 
//In function we get distance and color it with desirable color. The remainder of the slider is colored gray
export function fillSlider(from, to, sliderColor, rangeColor, controlSlider) {
    console.log("fillSlider")
    const rangeDistance = to.max-to.min;
    const fromPosition = parseInt(from.value) - to.min;
    const toPosition = parseInt(to.value) - to.min;
    const buttonwidth = 24;
    const sliderWidth = to.clientWidth;
    //Width ratio in pixels, this + 24px is how much it should skip each time the slider is moved
    const singleWidthPx = sliderWidth/rangeDistance; 
    const fillRatioPx = (singleWidthPx*fromPosition);
    //This calculates how much needs to be added to the gradient which is inverse to how high the from slider's index is
    const paddingPx = (((rangeDistance)-(fromPosition))/(rangeDistance))*buttonwidth; 

    //gradient that covers up the line from right of the startdate slider to the left of the endate slider, the start part has to be invinsible since it was going through the startdate button  
    controlSlider.style.background = `linear-gradient(
      to right,
      ${sliderColor} 0px,
      ${sliderColor} ${fillRatioPx+paddingPx}px,
      ${rangeColor} ${fillRatioPx+paddingPx}px,
      ${rangeColor} ${(toPosition)/(rangeDistance)*100}%, 
      ${sliderColor} ${(toPosition)/(rangeDistance)*100}%,
      ${sliderColor} 100%)`;
    
}


//sets the zIndex of startDateSlider element bigger than zIndex of endDateSlider in situation when startDateSlider has the max value
//have a difference of at least 2 between z-layers, otherwise it doesn't work
//active slider is set on top
export function setZLayer(startDateSlider, endDateSlider) {
    //get highest number in sliders, has to start at -1 otherwise the index goes higher than the actual max index
    let maxSliderIndex = startDateSlider.max;
    console.log("checking ZLayer...");
    
    //least problematic z-layering, have start always on top except for when startslider >= maxSliderindex
    if ((parseInt(startDateSlider.value) >= 0) && (parseInt(startDateSlider.value) < maxSliderIndex)) {
        startDateSlider.style.zIndex = 1;
        endDateSlider.style.zIndex = 4;
        console.log("setting ZLayer...\n\n");
    }
    else if ((parseInt(startDateSlider.value) >= maxSliderIndex) && (parseInt(endDateSlider.value) >= maxSliderIndex)) {
        startDateSlider.style.zIndex = 4;
        endDateSlider.style.zIndex = 1;
        console.log("setting ZLayer...\n\n");
    }
    else {
        console.log("ERROR: Something went wrong in setZLayer()\n\n");
    }
}

//checks if startslider is bigger than endslider and doesn't allow it to go higher than that
export function controlStartSlider(startSlider, endSlider, min_gap) {
    console.log("controlStartSlider")
    setZLayer(startSlider, endSlider);
    fillSlider(startSlider, endSlider, '#C6C6C600', '#09124F', endSlider);
    if(parseInt(endSlider.value) - (parseInt(startSlider.value) + min_gap) <= min_gap) {
        startSlider.value = parseInt(endSlider.value) - min_gap;
    }
}

//checks if endslider is bigger than startslider and doesn't allow it to go lower than that
export function controlEndSlider(startSlider, endSlider, min_gap) {
    console.log("controlEndSlider")
    setZLayer(startSlider, endSlider);
    fillSlider(startSlider, endSlider, '#C6C6C600', '#09124F', endSlider);
    if(parseInt(endSlider.value) - (parseInt(startSlider.value) + min_gap) <= min_gap) {
        endSlider.value = parseInt(startSlider.value) + min_gap;
    }
}