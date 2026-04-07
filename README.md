# IssueOps

IssueOps is a campus and hostel issue reporting system that helps students report problems, automatically categorizes them, routes them to the correct department, tracks status updates, and highlights issues that require immediate action when many users report the same problem.

This repository currently contains:
- A `FastAPI` backend for issue creation, duplicate detection, categorization, and status updates
- A `Vite` frontend scaffold for the web application UI
- A product-ready PRD and MVC architecture plan for growing the project into a full system

## Problem Statement

In campuses and hostels, students often face broken lights, sanitation issues, plumbing leaks, internet outages, and other recurring maintenance problems. These complaints are usually handled manually, which creates confusion, delays, duplicate reports, and poor visibility into resolution progress.

IssueOps solves this by giving students a single platform to report issues and letting the system:
- categorize the issue,
- assign it to the correct department,
- track its status,
- detect repeated reports,
- and escalate widespread problems for immediate action.

## Vision

Build a centralized complaint management platform for campuses and hostels that improves accountability, speeds up response time, and gives students transparent visibility into issue resolution.

## Objectives

- Provide a simple interface for students to report issues
- Automatically route complaints to the right department
- Allow students to track complaint status in real time
- Detect duplicate or similar complaints
- Escalate issues that affect many users
- Give administrators and departments a dashboard for monitoring and action

## Users

### 1. Students
- Report issues
- Track issue status
- View repeated/open issues in their area
- Receive updates

### 2. Department Staff
- View assigned issues
- Acknowledge complaints
- Update progress and resolution status
- Add remarks

### 3. Admin
- Manage departments and issue categories
- Monitor all complaints
- Reassign issues
- View analytics and escalation trends

## Core Features

### 1. Issue Reporting
- Students submit a title, description, category, and optional location/media
- Reports should be quick to file and mobile friendly

### 2. Smart Categorization
- The system classifies issues into categories such as:
  - Electrical
  - Plumbing
  - Sanitation
  - IT/Network
  - General

### 3. Department Routing
- Each category maps to a responsible department
- Example:
  - Electrical -> Electrical Department
  - Sanitation -> Sanitation Department
  - Plumbing -> Plumbing Department
  - IT -> IT Support

### 4. Duplicate Detection
- If many students report the same issue, the system should detect similarity using:
  - issue description
  - category
  - location
  - report frequency

### 5. Priority and Immediate Action
- Priority should increase as more reports are linked to the same issue
- When reports cross a configurable threshold, the issue is flagged as `Requires Immediate Action`

### 6. Status Tracking
- Suggested status lifecycle:
  - Reported
  - Acknowledged
  - In Progress
  - Resolved
  - Closed
  - Reopened

### 7. Notifications
- Students receive updates when the issue is acknowledged, updated, or resolved
- Departments receive alerts when new issues are assigned
- Admins receive escalation alerts

### 8. Dashboards
- Student dashboard
- Department dashboard
- Admin dashboard
