const Database = require('../database/Database');
const CalendarModel = require('../models/Calendar');
const ActivityModel = require('../models/Activity');
const respond = require('../hleper/responder');
const responses = require('../responses/activity.json');
const moment = require('jalali-moment');
moment().locale('fa');


class ActivityType {
  constructor () {
    this.calendarDatabase = new Database(CalendarModel);
    this.activityDatabase = new Database(ActivityModel);
  }

  async getMonthActivities (req, res) {
    try {
      const startDate = req.info.date;
      const endDate = moment.unix(startDate).add(1,'M').unix();

      let days = await this.calendarDatabase.getInSpan('date', startDate, endDate);
      const monthActivities= {};
      for (const day of days) {
        let dayActivities = JSON.parse(JSON.stringify(day.activities));
        monthActivities[day.date] = dayActivities.length;
      }
      return respond(res, responses.successful, monthActivities);
    } catch (err) {
      console.log('error in getMonthActivities handler', err);
      respond(res, responses.serverError);
    } 
  }
  async getDayActivities (req, res) {
    try {
      const todayDate = req.info.date;
      const tomorrowDate = moment.unix(todayDate).add(1,'d').unix();
      const todayActivities = [];

      let activities = await this.calendarDatabase.getInSpan('date', todayDate, tomorrowDate);
      let activitiesID = activities[0].activities;
      activitiesID = JSON.parse(JSON.stringify(activitiesID));

      for (const activityId of activitiesID) {
        let activity = await this.activityDatabase.getById(activityId);
        let progress;
        for (const [date] of Object.entries(activity.progress)) {
          if (date>=todayDate && date<tomorrowDate) {
            progress = activity.progress[date];
            break;
          }
        }
        if (!progress) progress = 0;
        const progressPercentage = Math.ceil(progress*100/activity.targetAmount);
        activity.progress = progressPercentage;
        todayActivities.push(activity);
      }
      return respond(res, responses.successful, todayActivities);
    } catch (err) {
      console.log('error in getDayActivities handler', err);
      respond(res, responses.serverError);
    } 
  }

}

module.exports = ActivityType;