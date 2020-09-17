import { Version, SPEvent } from '@microsoft/sp-core-library';
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneDropdown,
  PropertyPaneLabel,
  PropertyPaneButton,
  PropertyPaneTextField
} from '@microsoft/sp-webpart-base';
import { escape } from '@microsoft/sp-lodash-subset';

import {Calendar}    from '@fullcalendar/core';
import jaLocale from '@fullcalendar/core/locales/ja';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import swal2 from 'sweetalert2';

import styles from './GetScheduleWebPart.module.scss';
import * as strings from 'GetScheduleWebPartStrings';
import * as $ from 'jquery';
import * as React from 'react';
 
//import * as sp from 'ma'
import { EventObjectInput } from 'fullcalendar'; 
import * as moment from 'moment';
//import 'fullcalendar';

require('@fullcalendar/core/main.css');
require('@fullcalendar/daygrid/main.css');
require('@fullcalendar/timegrid/main.css');


const logo: any = require('./User.png');
import { MSGraphClient, MSGraphClientFactory } from '@microsoft/sp-http';
import * as MicrosoftGraph from '@microsoft/microsoft-graph-types';

 export interface IGetScheduleWebPartProps {
  description: string;
  head_disp: string;
  CalendarUrl:string;
  CategoryUrl:string;
  MySchedule:string;
  MyPass:string;
  errLabel:string;
}

export default class GetScheduleWebPart extends BaseClientSideWebPart<IGetScheduleWebPartProps>{

  private   randomID = Math.random().toString(36).slice(-6);
  private isLisenced = false;
  public render(): void {
    
    // カレンダーボタン表示・非表示
    var CalendID ="mycal-" + this.randomID;//this.instanceId;//
  
    //var chk_color ="chk_color" +randomID;
   this.domElement.innerHTML = `
    <div class="${styles.mycal}">      
    <div align=right id="mycal-chk_color" ></div>    
    <div id=`+CalendID+` class="${styles.calendar} `+this.randomID+ `"></div>  
    </div>`;
  //

  console.log("バージョン：1.2.1.5");
  //2020/07/30 webpartID
  this.ColorSet(this.randomID,CalendID);
  //this.ColorSet(this.instanceId,CalendID);
   
  }

  protected get dataVersion(): Version {
    return Version.parse('2.0');
  }
 
//Webpart Property
protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
  let allEventsUrl: any;
  
  if(!this.isLisenced ){       
    allEventsUrl = PropertyPaneLabel('emptyLabel', {
      text: ""
    });
  }
  else if(this.isLisenced || this.properties.MySchedule=="1"){
     
    allEventsUrl=PropertyPaneDropdown('MySchedule', {
      label: '',        
      options:  [
        { key: '1', text: '取得する' },
        { key: '0', text: '取得しない' }
      ]
    });
  }
  return {
    
    pages: [
      {
        
        header: {
          description: "MyCalendar Settings"//strings.PropertyPaneDescription
        },
        groups: [
          {
            groupName: "",//strings.BasicGroupName,
            groupFields: [
              PropertyPaneTextField('CalendarUrl', {
                label: 'カレンダーリスト名',
                //onGetErrorMessage: this.validateListName.bind(this),
                deferredValidationTime: 500

              }),
              PropertyPaneTextField('CategoryUrl', {
                label: 'カテゴリーリスト名',
                //onGetErrorMessage: this.validateListName.bind(this),
                deferredValidationTime: 500

              }),
  
              PropertyPaneDropdown('head_disp', {
                label: 'カレンダーヘッダー',
                options:  [
                  { key: '1', text: '表示' },
                  { key: '0', text: '非表示' }
                ]
              }),
               
              PropertyPaneTextField('MyPass', {
                label: 'ログインユーザーのスケジュールを表示',
                deferredValidationTime: 500
                
              }),
              PropertyPaneLabel('errLabel', {
                text: ""
                
              }),
              PropertyPaneButton('', { 
                text: "登録",                   
                onClick: this.cobWPPropButtonClick.bind(this)
                  }), 
             
              allEventsUrl
            ]
          }
        ]
      }
    ]
  };
}
  //ログインユーザーPASS検証
  private cobWPPropButtonClick(oldvalue: any):any{

    if(this.properties.MyPass !="P@ssw0rd"){
      this.isLisenced = false;
      alert("パスワードが間違いです。");
      this.context.propertyPane.refresh();
    }else{
      this.isLisenced = true;
      this.context.propertyPane.refresh();
    }
    
   
  }
// 非反応性のプロパティ ウィンドウ
protected get disableReactivePropertyChanges(): boolean { 
  return true; 
}
//chkbox
private _setButtonEventHandlers(): void {   
  
    
}
   //カレンダー
   private graphRenderList(CalendID,strMySchedule){


 //2020/07/30 webPartID
       
    
   var webpartID =this.context.instanceId;
   console.log("webpartID:"+webpartID);
    var SPURL=this.context.pageContext.web.absoluteUrl;

     if(!this.isLisenced){
        this.properties.MyPass = "";
     }
     var left = 'prev,next today';
     var right=  ',,';
     if(this.properties.head_disp=="1"){
       
       right=  'dayGridMonth,timeGridWeek,timeGridDay';
     } 
   
     var calendarEl = document.getElementById(CalendID);
     var calendar = new Calendar(calendarEl, {
       plugins: [ dayGridPlugin, timeGridPlugin],
        
       header:{
       left: left,
       center: 'title',
       right:right
       },
       
       locale: jaLocale,
       editable: true,
       
       eventClick: (info)=> {
              
         var  eventStart =moment(info.event.start).format('YYYY/MM/DD HH:mm') ;
         var  eventEnd = moment(info.event.end).format('YYYY/MM/DD HH:mm');
         var chk_callDay="";
         if(info.event.allDay){
           chk_callDay="checked";
           eventStart=moment(info.event.start).format('YYYY/MM/DD 00:00') ;
           eventEnd= moment(info.event.end).format('YYYY/MM/DD 00:00');
         }
         var category=info.event._def.ui.classNames[1];
         //var memo=info.event._def.ui.classNames[2];
         var memo =info.event.extendedProps.memo;
         if (memo==null) 
          {
             memo ="";
          }
         //swal2.fire( info.event.title,eventDetail ); 
         var shtml='<div style="border-bottom:1px solid #e9ecef;text-align:left;height:36px;vertical-align:middle">'+
         '<div  style="float : left"><font style="font-weight:800">予定詳細</font></div>'+
         '<div  style="float : right"><button class="swal2-outlook swal2-styled" style="margin:0;border-radius:0.25em;color:#fff;border:0;font-size:1.05em; background-color:#3085d6;display:none">OutLook登録</button></div>' +
         '</div>'+
         '<div style="height:6px;"></div>'+
          
        '<table style="width:100%;font-size:.9em"><tr><th align="left" style="font-weight:600;width:25%">タイトル </th>'+
        '<td align="left" colspan="2">'+info.event.title+'</td></tr>'+
        '<tr><th align="left" style="font-weight:600">開始時刻</th><td align="left">'+eventStart+'</td><td><input type="checkbox"'+chk_callDay+' disabled>終日</td></tr>'+
        '<tr><th align="left" style="font-weight:600">終了時刻</th><td align="left">'+eventEnd+'</td><td></td></tr>'+
        '<tr><th align="left" style="font-weight:600">カテゴリー</th><td align="left"  colspan="2">'+category+'</td></tr>'+
        '<tr><th align="left" style="font-weight:600">説明</th><td align="left"  colspan="2"><div style ="overflow-y:auto;height:100px;width:365px">'+memo+'</div></td></tr>'+
        ' </table>' ; 
         
         swal2.fire({
           html:shtml
         } );
         //OK ボタンサイズ調整
         $('.swal2-styled').css('padding','.25em 1em');
         //背景画面透明
         $('.ms-font-m').removeClass('swal2-shown');
         $('.ms-font-m').removeClass('swal2-height-auto');
         //JSON
         var data ={
          "Subject": info.event.title,
          "Body": {
            "ContentType": "HTML",
            "Content": "<html>"+memo+"</html>",
             
          },
          "Start": {
              "DateTime": eventStart,
              "TimeZone": "Tokyo Standard Time"
          },
          "End": {
              "DateTime": eventEnd,
              "TimeZone": "Tokyo Standard Time"
          },
          "isAllDay": info.event.allDay
          
        }

        var ms =this.context.msGraphClientFactory;
          
          //カレンダーの内容をOutLookに登録する
         $(".swal2-outlook").on('click', function(){
            // 通信実行
           //var ms =new  MSGraphClientFactory;
           ms.getClient()
           .then((client:MSGraphClient): void => {
            client
            .api('/me/events')
            .post(data, (err, res, success) => {
              if (err) {  
                     console.error(err);  
                return;  
              }                
              if (success)
              {
                console.log("success");
              }
              alert('該当データをOutLookに登録しました。');
            })//closes
           });
               
          //  MSGraphClient.api('/me/events').post(data);
          
        });

         //アラームのリンク処理アラームのリンク処理
         $(".swal2-content a").on('click',function(){
           var url =$(this).attr("href");
           window.open(url,"_blank");
           return false;
         });
                      
       //});
       },
       
       events:  (during,callback) => {
        
         var randomID =this.randomID; //2020/07/30
         //var randomID = this.instanceId;

         var firstDay =during.start.toDateString();
         var lastDay = during.end.toDateString();

         var spfirstDay =during.start.getFullYear().toString()+"/"+(during.start.getMonth()+1).toString()+"/"+during.start.getDate().toString()+"T00:00:00Z";
         var splastDay = during.end.getFullYear().toString()+"/"+(during.end.getMonth()+1).toString()+"/"+during.end.getDate().toString()+"T23:59:59Z";

         var calName = this.properties.CalendarUrl;   
         var restQuery = "/_api/Web/Lists/GetByTitle('"+calName+"')/items?$orderby=Modified desc&$select=ID,Title,MyCalEventDateFrom,MyCalEventDateTo,AllDay,Memo,\
         MyCalCategory/Title,MyCalCategory/Color&$expand=MyCalCategory&$filter=((MyCalEventDateFrom ge '"+spfirstDay+"' and  MyCalEventDateFrom le '"+splastDay +
         "' ) or (MyCalEventDateTo le '"+ splastDay +"' and MyCalEventDateTo ge '"+ spfirstDay +"'))&$top=200";
             $.ajax({
             url: SPURL + restQuery,
             type: "GET",
             dataType: "json",
             //async: false,
             headers: {
               Accept: "application/json;odata=nometadata"
             }
           
           })
          .done( (data, textStatus, jqXHR) => {
           var events=[] ;
           
             //----------OUT LOOK---------
             if ( strMySchedule =="1")// && this.isLisenced)
            {
             //var events=[] ;
             this.context.msGraphClientFactory
             .getClient()
             .then((client:MSGraphClient): void => {
               client
               .api(`/me/calendarview?startdatetime=${firstDay}&enddatetime=${lastDay}&$top=200`)
               .header('Prefer','outlook.body-content-type="html",outlook.timezone="Tokyo Standard Time"')
               .get((error: any, eventsResponse: any, rawResponse?: any) => {
                 if(error==null){
                   console.log(eventsResponse.value);
                   // Css
                   var cssNameOl =styles.eventnone;
                   
                   if($("#mycal-Outlook" +randomID).attr("data-value")=="1"){
                     cssNameOl=styles.eventblock;
                   }
                     var items: MicrosoftGraph.Event[] =eventsResponse.value;
                     $.each(items,function(key,list){
                       console.log(key);
                     //items.forEach(function(list,key){
                       if(!list.isCancelled){
                         events.push({
                         title: list.subject,
                         start: list.start.dateTime,
                         end: list.end.dateTime,
                         id: list.id,                    
                         color:"white",    
                         textColor:"black",                
                         text:"black",
                         borderColor :"black",                         
                         className: [cssNameOl,"Outlook"],
                          
                         //detail: list.bodyPreview,
                         detail: list.body.content,
                         extendedProps:{
                          memo:list.body.content
                        } ,        
                         allDay:list.isAllDay,
                         
                       });
                     }
                     }); 
   
               }else{
                 console.log("Exchange個人スケジュールの取得に失敗しました。");
               }
       //----------OUT LOOK---------
                 data.value.forEach(function(task,key){
                   console.log(key);
                   var color = task.MyCalCategory.Color;
                   if ( task.MyCalScheduleColor != null && task.MyCalScheduleColor!="") {
                       color = task.MyCalScheduleColor;
                     }
                     // Css
                     var cssName1 =styles.eventnone;
                     if($("#mycal-"+task.MyCalCategory.Title.replace(/\s+/g, "") +randomID +":checked").val()){
                       cssName1=styles.eventblock;
                     }
                     var cssName2=task.MyCalCategory.Title.replace(/\s+/g, "");
   
                     var start ;// =moment.utc(task.MyCalEventDateFrom).add("9","hours") ;
                     var end ;// =moment.utc(task.MyCalEventDateTo).add("9","hours") ;
                     var title =task.Title;
                     var allDay=true;
                     var memo =task.Memo;//カレンダーの説明　2020/07/27
                    // memo=memo.toString();
                     if(!task.AllDay) // time
                     {
                       // start  =moment.utc(task.MyCalEventDateFrom).add("9","hours").format("YYYY-MM-DD HH:mm").toString() ;
                       // end =moment.utc(task.MyCalEventDateTo).add("9","hours").format("YYYY-MM-DD HH:mm").toString() ;
                       start  =moment.utc(task.MyCalEventDateFrom).local().format("YYYY-MM-DD HH:mm").toString() ;
                       end =moment.utc(task.MyCalEventDateTo).local().format("YYYY-MM-DD HH:mm").toString() ;
                       allDay =false;
                       
                     }else{ // all day
                       // start  =moment.utc(task.MyCalEventDateFrom).format("YYYY-MM-DD HH:mm").toString() ;
                       // end =moment.utc(task.MyCalEventDateTo).add("1","days").format("YYYY-MM-DD HH:mm").toString();
                       start  =moment.utc(task.MyCalEventDateFrom).local().format("YYYY-MM-DD HH:mm").toString() ;
                       end =moment.utc(task.MyCalEventDateTo).local().add("1","days").format("YYYY-MM-DD HH:mm").toString();
                       allDay =true;
                     }
                     
                       events.push({
                         title: title,
                         id: task.ID,
                         color: color, 
                         classNames:[cssName1,cssName2],
                         //classNames:[cssName2,memo],
                         //editable: false,
                         allDay:allDay,
                         start:start,
                         end:end  ,
                         extendedProps:{
                            memo:memo
                          }                 
                       });
                     
                    
                   });
                   
                   callback(events);
               });
             });
            }
            // MySchdule 非表示(outlook)
            if (strMySchedule!="1" )//|| !this.isLisenced)
            {
             
             data.value.forEach(function(task,key){
               console.log(key);
               var color = task.MyCalCategory.Color;
               if ( task.MyCalScheduleColor != null && task.MyCalScheduleColor!="") {
                   color = task.MyCalScheduleColor;
                 }
                 // Css
                 var cssName1 =styles.eventnone;
                 if($("#mycal-"+task.MyCalCategory.Title.replace(/\s+/g, "") +randomID +":checked").val()){
                   cssName1=styles.eventblock;
                 }
                 var cssName2=task.MyCalCategory.Title.replace(/\s+/g, "");
                 var start ;// =moment.utc(task.MyCalEventDateFrom).add("9","hours") ;
                 var end ;// =moment.utc(task.MyCalEventDateTo).add("9","hours") ;
                 var title =task.Title;
                 var allDay=true;
                 var memo =task.Memo;//カレンダーの説明　2020/07/27
                // memo=memo.toString();
                 if(!task.AllDay) // time
                 {
                   start  =moment.utc(task.MyCalEventDateFrom).add("9","hours").format("YYYY-MM-DD HH:mm").toString() ;
                   end =moment.utc(task.MyCalEventDateTo).add("9","hours").format("YYYY-MM-DD HH:mm").toString() ;
                   allDay =false;
                   title =task.Title;// +"_"+ moment.utc(task.MyCalEventDateFrom).add("9","hours").format("HH:mm");
                 }else{ // all day
                   start  =moment.utc(task.MyCalEventDateFrom).local().format("YYYY-MM-DD HH:mm").toString() ;
                   end =moment.utc(task.MyCalEventDateTo).local().add("1","days").format("YYYY-MM-DD HH:mm").toString();
                   allDay =true;
                 }
                 
                 events.push({
                   title: title,
                   id: task.ID,
                   color: color, 
                   classNames:[cssName1,cssName2],
                   //classNames:[cssName2,memo],
                   allDay:allDay,
                   start:start,
                   end: end ,
                   extendedProps:{
                    memo:memo
                  }    
                 });
               });
               callback(events);
   
            }
            
           });
       }
     });
 
     calendar.render();  
     
     let Elements = this.domElement.querySelectorAll('input[name="disChk"]');
     
     for(let j:number = 0;j<Elements.length;j++){
       Elements[j].addEventListener('click',function(event){
         var checkIdclass = this.id.substring(6,this.id.length-6);
         if(this.id.indexOf("mycal-Outlook")==0){//Myボタン
           console.log($(this).attr("data-value"));
           //var myRodomID=this.className.substring(0,this.className.indexOf("RodomID")).trim();
           var myRodomID=this.id.substring(this.id.length-6,this.id.length).trim();
           var checked=$(this).attr("data-value");
          //2020/08/05 webpart
           //var webPartID=$("#"+this.id).attr("webpartid"); 
           var webPartID=$(this).attr("webpartid");
           webPartID +="outlook";
           

           if (checked=="0") {//My schedule非表示→表示
             $(this).attr("data-value","1");
              //2020/08/05 webpart
             localStorage.setItem(webPartID, "1");
             //this.css("background-color","#ccc");//#2c3e50
             $(this).removeClass(styles.mydisable);
             $('.'+myRodomID +' .'+checkIdclass).removeClass(styles.eventnone);
             $('.'+myRodomID +' .'+checkIdclass).addClass(styles.eventblock);
             //$(this).addClass(styles.btn);
             //this.disabled=true;
             // Write a local item..
             localStorage.setItem("myKey", "myValue");
           }else
           {
              //2020/08/05 webpart
              localStorage.setItem(webPartID, "0");
             $(this).attr("data-value","0");
             //this.disabled=false;
             //this.css("background-color","#2c3e50");//#2c3e50
             //$(this).removeClass(styles.btn);
             $(this).addClass(styles.mydisable);
             $('.'+myRodomID +' .'+checkIdclass).addClass(styles.eventnone);
             $('.'+myRodomID +' .'+checkIdclass).removeClass(styles.eventblock);
           } 
         }else{//チェックボックス
          //2020/08/05 localStorage
         // var webPartID=$("#"+this.id).attr("webpartid");          
          var webPartID=$(this).attr("webpartid");
          var title ="";
          if (this.id!="checkAll"){
            title=this.id.substring(0,(this.id.length-6));
           
          }
          var webPartIDkey =webPartID +title;
          localStorage.setItem(webPartIDkey, this.checked);
          //2020/08/05 localStorage ---End---

          if (this.id=="checkAll"){
             //2020/07/30
             var randomclass=this.className;
             //$('input[name="disChk"]').prop('checked', $(this).is(':checked') );
       
             var $ArrayCheck=$('input[name="disChk"]');
             
             if(this.checked){
               $.each($ArrayCheck,function(index, elem){
                 var allclassName = this.id.substring(6,this.id.length-6);
                 //2020/07/30
                 var everyclassName= this.id.substring(this.id.length-6);

                 if(this.id!="checkAll" && this.id.indexOf("mycal-Outlook")<0 && everyclassName==randomclass){
                  //if(this.id!="checkAll" && this.id.indexOf("mycal-Outlook")<0){ 
                   $('.'+this.className +' .'+allclassName).removeClass(styles.eventnone);
                   $('.'+this.className +' .'+allclassName).addClass(styles.eventblock);
                   //2020/07/30
                   $(this).prop('checked', true );

                   //var webPartID=$("#"+this.id).attr("webpartid");
                   var webPartID=$(this).attr("webpartid");

                   var title=title=this.id.substring(0,(this.id.length-6));
                   var webPartIDkey =webPartID +title;
                   localStorage.setItem(webPartIDkey, "true");  
                 }
                 
               });
             }else{
                 $.each($ArrayCheck,function(index, elem){
                   
                   var allclassName = this.id.substring(6,this.id.length-6);
                   //2020/07/30
                   var everyclassName= this.id.substring(this.id.length-6);

                   if(this.id!="checkAll" && this.id.indexOf("mycal-Outlook")<0 && everyclassName==randomclass){
                   // if(this.id!="checkAll" && this.id.indexOf("mycal-Outlook")<0){
                     $('.'+this.className +' .'+allclassName).removeClass(styles.eventblock);
                     $('.'+this.className +' .'+allclassName).addClass(styles.eventnone);
                     //2020/07/30
                    $(this).prop('checked', false );
                    //var webPartID=$("#"+this.id).attr("webpartid");
                    var webPartID=$(this).attr("webpartid");

                    var title=title=this.id.substring(0,(this.id.length-6));
                    var webPartIDkey =webPartID +title;
                    localStorage.setItem(webPartIDkey, "false");  
                   }
                 });
             }
           }
           var BcheckAll = true;
           if(this.checked){ 
             //check all 判断   
             //2020/07/30
             var thisclassName =this.id.substring(this.id.length-6);             
             $.each($('input[type="checkbox"][name="disChk"][id!="checkAll"][class="'+thisclassName+'"]'),function(index,elem){
            //$.each($('input[type="checkbox"][name="disChk"][id!="checkAll"]'),function(index,elem){
               if (!$(elem).prop('checked')){
                 BcheckAll=false;
                 return false;
               }
             });
             //2020/07/30
             if (BcheckAll)  {
               
              $('input[id="checkAll"][class="'+thisclassName+'"]').prop('checked',true);
              //2020/08/05 localStorage
               //webPartID=$('input[id="checkAll"][class="'+thisclassName+'"]').attr("webpartid");          

              localStorage.setItem(webPartID, "true");
              //2020/08/05 localStorage ---End---
             }
             //if (BcheckAll)  $('input[id="checkAll"]').prop('checked',true);
             if (this.id!="checkAll"){
               $('.'+this.className +' .'+checkIdclass).removeClass(styles.eventnone);
               $('.'+this.className + ' .'+checkIdclass).addClass(styles.eventblock);
             }
           }
           else{
             //check all 判断  
             //2020/07/30
             var thisclassName =this.id.substring(this.id.length-6);
             
             $('input[id="checkAll"][class="'+thisclassName+'"]').prop('checked',false);
             //2020/08/05 localStorage
             var webPartID=$('input[id="checkAll"][class="'+thisclassName+'"]').attr("webpartid");          

             localStorage.setItem(webPartID, "false");
             //2020/08/05 localStorage ---End---

             //$('input[id="checkAll"]').prop('checked',false);
             if (this.id!="checkAll"){
               $('.'+this.className +' .'+checkIdclass).removeClass(styles.eventblock);
               $('.'+this.className +' .'+checkIdclass).addClass(styles.eventnone);
             }
           }
         }
         
 
        
         //calendar
         
         calendar.updateSize();
 
        
       }
       
       );
       
   }
     
     
   }        
// check box Color set
private ColorSet(randomID,CalendID){
  //2020/7/30
  var webpartID = this.context.instanceId;

  let html: string = '';
  var strMySchedule=this.properties.MySchedule;
 // let checkAllhtml='<input type="checkbox"  checked id="checkAll" name="disChk" '+'>ALL';

 //2020/08/05 webpartID Read a local item
  
 var checkAllValue = localStorage.getItem(webpartID);
 if (checkAllValue ==null || checkAllValue == "") {
  checkAllValue="checked";
 }
 else{

  checkAllValue=checkAllValue=="false"?"":"checked";

 }
  let checkAllhtml='<input type="checkbox" ' + checkAllValue +' id="checkAll" name="disChk" class="'+randomID +'" webpartID="' +webpartID +'">ALL';
   // MySchdule 非表示(outlook):ALL checked 全表示
   /* if (strMySchedule !="1" )//|| !this.isLisenced)
   {
    checkAllhtml='<input type="checkbox" checked id="checkAll" name="disChk">ALL';
   } */
  
  //var ss=escape(this.properties.CategoryUrl);
   var restQuery = "/_api/Web/Lists/GetByTitle('" + this.properties.CategoryUrl + "')/items?$select=Title,Color,ID";
    $.ajax({
      url: this.context.pageContext.web.absoluteUrl + restQuery,
      type: "GET",
      dataType: "json",
      headers: {
        Accept: "application/json;odata=nometadata"
      }
    
    })
   .done( (data, textStatus, jqXHR) => {
     

       data.value.forEach(function(task,key){
         console.log(key);
          //2020/08/05 webpartID Read a local item  
      var checkValue = localStorage.getItem(webpartID +"mycal-"+task.Title.replace(/\s+/g, ""));
      if (checkValue ==null || checkValue == "") {
        checkValue="checked";
      }
       else{

        checkValue=checkValue=="false"?"":"checked";

       }
      html += '<input type="checkbox" name="disChk" id ="mycal-' +task.Title.replace(/\s+/g, "") +randomID+'" webpartID="' +webpartID +
            '" class ="'+randomID +'"' +checkValue +'><font color="' +task.Color + '">■</font>';
      });
    
     const listContainer: Element = this.domElement.querySelector('#mycal-chk_color');
     
    if(this.properties.MySchedule=="1"){//this.isLisenced && 
      //2020/08/05
      var outlooklValue = localStorage.getItem(webpartID+"outlook");

      if(outlooklValue==null || outlooklValue == ""){
        outlooklValue="0";
      }
      var classdis ="";
      if(outlooklValue=="0"){
        classdis=" RodomID " +styles.mydisable;
      }
      listContainer.innerHTML = `<input type="button" name="disChk" style="margin-top:-2.8px" id ="mycal-Outlook` +randomID+ `" webpartID="` +webpartID +
      `" class ="`+randomID + classdis +`  fc-button fc-button-primary "  data-value="`+outlooklValue+`" value="My">`+"  "+checkAllhtml+html;
      //listContainer.innerHTML =checkAllhtml+ `<input type="checkbox" name="disChk" id ="mycal-Outlook` +randomID+`" class ="`+randomID +`" ><img src="${logo}" width="15"/>`+html;
    }else
     {
      listContainer.innerHTML =checkAllhtml+html;
     }
     // Click event
      //this._setButtonEventHandlers();
    //カレンダー
    this.graphRenderList(CalendID,strMySchedule);
   }).fail(function(jqXHR, textStatus, errorThrown){
    // エラーの場合処理
      //カレンダー
      
     // this.graphRenderList(CalendID);
      //alert("カテゴリーを入力してください！");
    
    
  });
  
   
}


 private validateListName(value: string): Promise<string> {
   return ;
 /*  return new Promise<string>((resolve: (validationErrorMessage: string) => void, reject: (error: any) => void): void => {
     if (value === null ||
       value.length === 0) {
       resolve('Provide the list name');
       return;
     }

    // this.context.spHttpClient.get(this.context.pageContext.web.absoluteUrl + `/_api/web/lists/getByTitle('${escape(value)}')?$select=Id`, SPHttpClient.configurations.v1)
     this.context.spHttpClient.get(this.context.pageContext.web.absoluteUrl + `/_api/web/lists/getByTitle('${value}')?$select=Id`, SPHttpClient.configurations.v1)
     .then((response: SPHttpClientResponse): void => {
         if (response.ok) {
           resolve('');
           return;
         }
         else if (response.status === 404) {
          // resolve(`List '${escape(value)}' doesn't exist in the current site`);
           resolve(`List '${value}' doesn't exist in the current site`);
           return;
         }
         else {
           resolve(`Error: ${response.statusText}. Please try again`);
           return;
         }
       })
       .catch((error: any): void => {
         resolve(error);
       });
   }); */
 }

}
