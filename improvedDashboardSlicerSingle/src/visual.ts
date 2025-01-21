/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
* THIS SOFTWARE USED CHAT GPT AS A BASIS FOR PARTS OF THE CODE
*/

"use strict";

import powerbi from "powerbi-visuals-api";
import "../style/visual.less";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import DataView = powerbi.DataView;
import{AdvancedFilter,Filter,IAdvancedFilter,IAdvancedFilterCondition,IFilterColumnTarget} from "powerbi-models";

export class SliderVisual implements IVisual {
    private target: HTMLElement;
    private host: powerbi.extensibility.visual.IVisualHost;
    svg: any;
    private dates : OurModel[] = [];
    private formattedDate : string;
    private inputDateTxt : HTMLElement;
    private dateSlider;
    private isFirstRun = true;
    private firstArrayDate;
    private lastArrayDate;
    private div_range_container;
    private div_sliders_control;
    private div_form_control;
    private div_form_txt_min;
    private div_form_txt_max;
    private div_form_txt;
    private filterColumnTarget: IFilterColumnTarget = null;
    private dataView;
    
    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.host = options.host;

        this.dateSlider = document.createElement("input");
        this.dateSlider.type = "range";
        this.dateSlider.step = "1";
        this.dateSlider.className = "slider-input";

        this.dateSlider.oninput = (event) => {
            console.log("DateSlider moved...");

            const value = parseInt((event.target as HTMLInputElement).value);
            console.log("value: ", value);
            console.log("date at value: " + this.dates[value].yearMonth);
            
            //finds the highest date in the array
            for (let i in this.dates){
                this.lastArrayDate = this.dates[i].yearMonth.toString();
            }

            this.applyFilter(this.dates[value].yearMonth, this.dataView);

            //reading date and formatting it
            let readDates = new Date(this.dates[value].date);
            this.formattedDate = this.formatDate(readDates);
            this.inputDateTxt.innerHTML = `<b>${this.formattedDate}<b>`;
        };

        //create elements and give them class names
        this.div_range_container = document.createElement("div");
        this.div_range_container.className = "range_container";
        this.div_sliders_control = document.createElement("div");
        this.div_sliders_control.className = "sliders_control";
        //create texboxes with year and month string to show user what is selected
        this.inputDateTxt = document.createElement("div");
        this.inputDateTxt.className = "input_date_txt";
        this.div_form_control = document.createElement("Div");
        this.div_form_control.className = "form_control";
        this.div_form_txt_min = document.createElement("div");
        this.div_form_txt_min.className = "form_txt_min";
        this.div_form_txt_max = document.createElement("div");
        this.div_form_txt_max.className = "form_txt_max";
        this.div_form_txt = document.createElement("div");
        this.div_form_txt.className = "form_txt";
        
        //append the elements, put elements into fragments for nesting
        /* 
        Aproximate HTML structure
        <div class="range_container">
            <div class="sliders_control">
                <input type="range" class="slider_input"/>
            </div>
            <div class="form_control">
                <div class="input_date_txt"></div>
            </div>
        </div>
        */
       
        const mainFragment = document.createDocumentFragment();
        const slidersControlFragment = document.createDocumentFragment();
        const txtFragment = document.createDocumentFragment();

        slidersControlFragment.appendChild(this.div_sliders_control)
        .appendChild(this.dateSlider);
        txtFragment.appendChild(this.div_form_control);
        this.div_form_control.appendChild(this.inputDateTxt);
        mainFragment.appendChild(this.div_range_container)
        .appendChild(slidersControlFragment);
        this.div_range_container.appendChild(txtFragment);
        this.target.appendChild(mainFragment);

    }
 
    public update(options: VisualUpdateOptions) {
        let dataView: DataView = options.dataViews[0];

        //makes it so that the dates don't update every time you move a slider
        if(this.isFirstRun){
            console.log("is first run")
            const categories = dataView.categorical.categories[0].values;
            for (let i=0; i < categories.length; i++){
                console.log("Date "+ (i+1) + " in visual: " + categories[i].toString());

                const date = new Date(dataView.categorical.values[0].values[i].toString())
                console.log("date year " + date.getFullYear().toString() + " date month "+date.getMonth().toString())

                //yearMonth : YearMonthStr, 
                this.dates.push({
                    yearMonth : categories[i].toString(),
                    date : date
                })
            }


            //uncomment if you want to see
            /*for(let i in this.dates){
                console.log("Dates in dates[] toString(): " + this.dates[i].date.toString());
            }*/

            this.isFirstRun = false;
            this.dateSlider.min = 0;
            this.dateSlider.max = this.dates.length - 1;
            this.dateSlider.value = this.dates.length - 1;
            
            for (let i in this.dates){
                this.lastArrayDate = this.dates[i].date.toString();
            }

            this.dataView = dataView;

            //consider having so that whenever a filter is applied it only takes in the raw date and formats it in the viusal file, not the pre-formatted year month string from DB
            
            let lastReadDate = new Date(this.lastArrayDate);
            this.formattedDate = this.formatDate(lastReadDate);
            this.applyFilter(this.dates[this.dateSlider.value].yearMonth, this.dataView);
            this.inputDateTxt.innerHTML = `<b>${this.formattedDate}<b>`;

        }
        
    }

    private formatDate(dateToFormat : Date) {
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
  
    private applyFilter(filterDate: string, dataView : DataView) {
        //look at this (advanced filter API): https://learn.microsoft.com/en-us/power-bi/developer/visuals/filter-api
        console.log("Applying date filter...");
        
        if (filterDate) {
            let categories : powerbi.DataViewCategoricalColumn = dataView.categorical.categories[0];
            console.log("Table: " + categories.source.queryName.substr(0, categories.source.queryName.indexOf('.')));
            console.log("Column: " + categories.source.displayName);
            let target: IFilterColumnTarget = {
                //this line reads the table name from the metadata
                table: categories.source.queryName.substr(0, categories.source.queryName.indexOf('.')),
                //this line reads the column name that is used for filtering
                column: categories.source.displayName
            };
            // Create an advanced filter for the date range
            let conditions: IAdvancedFilterCondition[] = [];
            conditions.push({
                operator: "Is",
                value: filterDate
            });

            let filter = new AdvancedFilter(target, "And", conditions);
            // Apply the filter using the host's applyJsonFilter method
            this.host.applyJsonFilter(filter, "general", "filter", powerbi.FilterAction.merge);
        }
    }
    
}

export interface OurModel{
    yearMonth : string
    date : Date
}