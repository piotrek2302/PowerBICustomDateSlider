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

import * as functions from "./functions";
import { AdvancedFilter, IAdvancedFilterCondition, IFilterColumnTarget } from "powerbi-models";
import { YearMonth } from "./yearmonth";
import { every, format, min } from "d3";

export class SliderVisual implements IVisual {
    private target: HTMLElement;
    private host: IVisualHost;
    svg: any;
    private tableName?:string
    private columnName?:string
    private dates: string[] = [];
    private startDateSlider: HTMLInputElement;
    private startDateTxt: HTMLElement;
    private endDateSlider: HTMLInputElement;
    private endDateTxt: HTMLElement;
    private isFirstRun = true;
    private min_gap = 0;
    private control_for_slider_start = true;
    private control_for_slider_end = true;

    //use this to read data fields from powerBI: dataView.categorical.values[x].values[i]

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.host = options.host;

        //create a start date slider
        this.startDateSlider = document.createElement("input");
        this.startDateSlider.type = "range";
        this.startDateSlider.step = "1";
        this.startDateSlider.className = "startdate-slider-input"

        this.startDateSlider.oninput = (event) => {

            const value = parseInt((event.target as HTMLInputElement).value);

            //control so that once you drag a slider past the enddate slider it doesn't apply the filter
            this.control_for_slider_start = true;
            if (value > parseInt(this.endDateSlider.value)) {
                this.control_for_slider_start = false;
            }

            if (this.control_for_slider_start == true) {
                
                

                let startDateIndex = parseInt(this.startDateSlider.value);
                console.log("Start date slider value: " + this.dates[startDateIndex] + " index: " + value);
                functions.controlStartSlider(this.startDateSlider, this.endDateSlider, this.min_gap);
                
                //reading date and formatting it
                const startDate = new YearMonth(this.dates[value])
                this.startDateTxt.innerHTML = `Start: <b>${startDate.formatDate()}</b>`
                console.log("startDateSlider is smaller than endDateSlider\n\n");

            }
            else if (this.control_for_slider_start == false) {
                functions.controlStartSlider(this.startDateSlider, this.endDateSlider, this.min_gap);
                console.log("startDateSlider is bigger than endDateSlider\n\n");
            }
            else {
                console.log("ERROR: If you see this, something went wrong in control_for_slider_start check\n\n");
            }
        }

        this.startDateSlider.onchange = (event) => {
            console.log("StartDateSlider moved...");
            
            if (this.control_for_slider_start == true) {
                const value = parseInt((event.target as HTMLInputElement).value);

                let endDateIndex = parseInt(this.endDateSlider.value);
                console.log("Start date slider value " + this.dates[value].toString() + " index: " + value)

                this.applyFilter(this.dates[value], this.dates[endDateIndex], this.host);

            }
        };

        //create an end date slider
        this.endDateSlider = document.createElement("input");
        this.endDateSlider.type = "range";
        this.endDateSlider.step = "1";
        this.endDateSlider.className = "enddate-slider-input"

        this.endDateSlider.oninput = (event) => {

            //control so that once you drag a slider past the startdate slider it doesn't apply the filter
            this.control_for_slider_end = true;
            if (parseInt(this.startDateSlider.value) > parseInt(this.endDateSlider.value)) {
                this.control_for_slider_end = false;
            }

            if (this.control_for_slider_end == true) {
                const value = parseInt((event.target as HTMLInputElement).value);

                let endDateIndex = parseInt(this.endDateSlider.value);
                console.log("End date slider value " + this.dates[endDateIndex].toString())
                functions.controlEndSlider(this.startDateSlider, this.endDateSlider, this.min_gap);

                //reading date and formatting it
                const endDate = new YearMonth(this.dates[value])
                this.endDateTxt.innerHTML = `End: <b>${endDate.formatDate()}<b>`;
                console.log("endDateSlider is bigger than startDateSlider\n\n");

            }
            else if (this.control_for_slider_end == false) {
                functions.controlEndSlider(this.startDateSlider, this.endDateSlider, this.min_gap);
                console.log("endDateSlider is smaller than startDateslider");
            }
            else {
                console.log("ERROR: If you see this, something went wrong in control_for_slider_end\n\n");
            }
        }
        this.endDateSlider.onchange = (event) => {
            console.log("EndDateSlider moved...");

            const value = parseInt((event.target as HTMLInputElement).value);

            let startDateIndex = parseInt(this.startDateSlider.value);
            console.log("End date slider value " + this.dates[value].toString())

            this.applyFilter(this.dates[startDateIndex], this.dates[value], this.host);

        };

        //create elements and give them class names
        const div_range_container = document.createElement("div");
        div_range_container.className = "range_container";
        const div_sliders_control = document.createElement("div");
        div_sliders_control.className = "sliders_control";
        //create texboxes with year and month string to show user what is selected
        this.startDateTxt = document.createElement("div");
        this.startDateTxt.className = "start_date_txt";
        this.endDateTxt = document.createElement("div");
        this.endDateTxt.className = "end_date_txt";
        const div_form_control = document.createElement("Div");
        div_form_control.className = "form_control";

        //append the elements, put elements into fragments for nesting
        /* 
        HTML structure
        <div class="range_container">
            <div class="sliders_control">
                <input type="range" class="startdate_slider_input"/>
                <input type="range" class="enddate_slider_input"/>
            </div>
            <div class="form_control">
                <div class="start_date_txt"></div>
                <div class="end_date_txt"></div>
            </div>
        </div>
        */

        const mainFragment = document.createDocumentFragment();
        const slidersControlFragment = document.createDocumentFragment();
        const txtFragment = document.createDocumentFragment();

        slidersControlFragment.appendChild(div_sliders_control)
            .appendChild(this.startDateSlider);
        div_sliders_control.appendChild(this.endDateSlider);
        txtFragment.appendChild(div_form_control);
        div_form_control.appendChild(this.startDateTxt);
        div_form_control.appendChild(this.endDateTxt);
        mainFragment.appendChild(div_range_container)
            .appendChild(slidersControlFragment);
        div_range_container.appendChild(txtFragment);
        this.target.appendChild(mainFragment);

    }

    public update(options: VisualUpdateOptions) {
        console.log("update() is called")
        let dataView: DataView = options.dataViews[0];
        //this.updated_categories_length = dataView.categorical.categories[0].values.length;
        //the variables below can't be read properly

        //console.log("printing jsonFilters",options.jsonFilters);

        //makes it so that the dates don't update every time you move a slider
        if (this.isFirstRun) {

            const filtercolumn = dataView.table.columns.find(x=> x.roles!['filtercolumn']);
            this.tableName = filtercolumn.expr['arg']['source']['entity']
            this.columnName = filtercolumn.expr['arg']['ref']

            //read incoming mindate and maxdate from the DB table
            let minDate = dataView.table.rows[0][0].toString();
            let maxDate = dataView.table.rows[0][1].toString();

            console.log("mindate =", minDate, "maxdate =", maxDate);
            this.dates = functions.makeMinMaxDatesArray(minDate, maxDate)
            //prints all dates in datesArray
            for (let i in this.dates) {
                console.log("datesArray[" + i + "]= " + this.dates[i]);
            }
            console.log("is first run")

            //the log below shows 2021-12 as the date, i think this is reading the wrong thing. i was reading the wrong column

            //console.log("Length of values[1]=", dataView.categorical.values[1].)

            //updated_categories_length = categories.length;
            this.isFirstRun = false;
            this.startDateSlider.min = "0";
            this.startDateSlider.max = (this.dates.length - 1).toString();
            this.startDateSlider.value = "0";
            this.endDateSlider.min = "0";
            this.endDateSlider.max = (this.dates.length - 1).toString();
            this.endDateSlider.value = (this.dates.length - 1).toString();

            this.applyFilter(minDate, maxDate, this.host);
            functions.fillSlider(this.startDateSlider, this.endDateSlider, '#C6C6C600', '#09124F', this.endDateSlider)
            this.startDateTxt.innerHTML = `Start: <b>${new YearMonth(minDate).formatDate()}</b>`;
            this.endDateTxt.innerHTML = `End: <b>${new YearMonth(maxDate).formatDate()}<b>`;
        }
    }

    public applyFilter(startDate: string, endDate: string, host: IVisualHost) {
        //look at this (advanced filter API): https://learn.microsoft.com/en-us/power-bi/developer/visuals/filter-api
        //console.log("applyFilter")
        //console.log("Applying date filter...");

        if (startDate && endDate) {
            //let categories : powerbi.DataViewCategoricalColumn = dataView.categorical.categories[0];
            //console.log("Table: " + categories.source.queryName.substring(0, categories.source.queryName.indexOf('.')));
            //console.log("Column: " + categories.source.displayName);
       
            /*let target: IFilterColumnTarget = {
                table: dataView.table.columns[2].expr.

            }
            /*let target: IFilterColumnTarget = {
                //this line reads the table name from the metadata
                table: categories.source.queryName.substring(0, categories.source.queryName.indexOf('.')),
                //this line reads the column name that is used for filtering
                column: categories.source.displayName
            };*/

            let target: IFilterColumnTarget = {
                //this line reads the table name from the metadata
                table: this.tableName,
                //this line reads the column name that is used for filtering
                column: this.columnName
            };

            // Create an advanced filter for the date range
            let conditions: IAdvancedFilterCondition[] = [];
            conditions.push({
                operator: "GreaterThanOrEqual",
                value: startDate
            });
            {
                conditions.push({
                    operator: "LessThanOrEqual",
                    value: endDate
                })
            };

            let filter = new AdvancedFilter(target, "And", conditions);
            // Apply the filter using the host's applyJsonFilter method
            host.applyJsonFilter(filter, "general", "filter", powerbi.FilterAction.merge);
        }
    }


}

export interface OurModel {
    yearMonth: string
    date: Date
}