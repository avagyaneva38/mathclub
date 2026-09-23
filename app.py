import streamlit as st
import json
import os

from io import BytesIO

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak
)


# ==================================================
# PAGE SETUP
# ==================================================

st.set_page_config(
    page_title="Math Club Finance",
    page_icon="∑",
    layout="wide"
)


# ==================================================
# DESIGN
# ==================================================

st.markdown(
    """
    <style>

    /* ==================================================
       OVERALL THEME
       Warm collegiate / autumn / mathematics
    ================================================== */

    html, body, [class*="css"] {
        font-family: "Times New Roman", Times, serif !important;
    }

    .stApp,
    .stApp * {
        font-family: "Times New Roman", Times, serif !important;
    }


    /* --------------------------------------------------
       MAIN BACKGROUND
    -------------------------------------------------- */

    .stApp {
        background-color: #fbf5f1 !important;
        color: #1a1111 !important;
    }


    [data-testid="stAppViewContainer"] {
        background-color: #fbf5f1 !important;
    }


    [data-testid="stHeader"] {
        background-color: #fbf5f1 !important;
    }


    /* --------------------------------------------------
       SIDEBAR
       Deep burgundy like the reference image
    -------------------------------------------------- */

    [data-testid="stSidebar"] {
        background-color: #5f1719 !important;
        border-right: 1px solid #321010 !important;
    }


    [data-testid="stSidebar"] * {
        color: #fff8f2 !important;
    }


    [data-testid="stSidebar"] h1 {
        color: #ffffff !important;
        letter-spacing: 2px !important;
        font-weight: bold !important;
    }


    /* Sidebar navigation */

    [data-testid="stSidebar"] [role="radiogroup"] label {
        padding: 7px 9px !important;
        border-radius: 4px !important;
    }


    [data-testid="stSidebar"] [role="radiogroup"] label:hover {
        background-color: #772426 !important;
    }


    /* --------------------------------------------------
       HEADINGS
    -------------------------------------------------- */

    h1 {
        color: #5f1719 !important;
        font-weight: 700 !important;
        letter-spacing: 0.5px !important;
    }


    h2 {
        color: #5f1719 !important;
        font-weight: 700 !important;
    }


    h3, h4 {
        color: #351718 !important;
        font-weight: 700 !important;
    }


    p, label {
        color: #1a1111 !important;
    }


    /* --------------------------------------------------
       DIVIDERS
    -------------------------------------------------- */

    hr {
        border-color: #b98d7e !important;
        opacity: 0.65 !important;
    }


    /* --------------------------------------------------
       METRIC CARDS
    -------------------------------------------------- */

    [data-testid="stMetric"] {
        background-color: #f4e3dc !important;

        border: 1px solid #301718 !important;
        border-radius: 5px !important;

        padding: 16px !important;

        box-shadow: none !important;
    }


    [data-testid="stMetric"] * {
        color: #1a1111 !important;
    }


    [data-testid="stMetricLabel"] {
        color: #5f1719 !important;
        font-weight: bold !important;
    }


    /* --------------------------------------------------
       REGULAR BUTTONS
    -------------------------------------------------- */

    .stButton > button {
        background-color: #fffaf7 !important;
        color: #401517 !important;

        border: 1px solid #401517 !important;
        border-radius: 4px !important;

        box-shadow: none !important;

        font-weight: bold !important;
    }


    .stButton > button * {
        color: #401517 !important;
    }


    .stButton > button:hover {
        background-color: #ead1c8 !important;
        color: #401517 !important;

        border: 1px solid #401517 !important;
    }


    .stButton > button:hover * {
        color: #401517 !important;
    }


    /* --------------------------------------------------
       FORM BUTTONS
    -------------------------------------------------- */

    .stFormSubmitButton > button {
        background-color: #fffaf7 !important;
        color: #401517 !important;

        border: 1px solid #401517 !important;
        border-radius: 4px !important;

        box-shadow: none !important;

        font-weight: bold !important;
    }


    .stFormSubmitButton > button * {
        color: #401517 !important;
    }


    .stFormSubmitButton > button:hover {
        background-color: #ead1c8 !important;
        color: #401517 !important;

        border: 1px solid #401517 !important;
    }


    /* --------------------------------------------------
       DOWNLOAD BUTTON
    -------------------------------------------------- */

    .stDownloadButton > button {
        background-color: #fffaf7 !important;
        color: #401517 !important;

        border: 1px solid #401517 !important;
        border-radius: 4px !important;

        box-shadow: none !important;

        font-weight: bold !important;
    }


    .stDownloadButton > button * {
        color: #401517 !important;
    }


    .stDownloadButton > button:hover {
        background-color: #ead1c8 !important;
        border: 1px solid #401517 !important;
    }


    /* --------------------------------------------------
       DISABLED BUTTONS
    -------------------------------------------------- */

    .stButton > button:disabled {
        background-color: #eee3df !important;
        color: #8b7772 !important;

        border: 1px solid #ad9992 !important;

        opacity: 1 !important;
    }


    .stButton > button:disabled * {
        color: #8b7772 !important;
    }


    /* --------------------------------------------------
       TEXT INPUTS
    -------------------------------------------------- */

    input {
        background-color: #fffaf7 !important;
        color: #111111 !important;

        border-color: #4d2929 !important;
    }


    textarea {
        background-color: #fffaf7 !important;
        color: #111111 !important;

        border-color: #4d2929 !important;
    }


    /* --------------------------------------------------
       SELECT BOXES
    -------------------------------------------------- */

    [data-baseweb="select"] > div {
        background-color: #fffaf7 !important;
        color: #111111 !important;

        border-color: #4d2929 !important;
    }


    /* --------------------------------------------------
       NUMBER INPUTS
    -------------------------------------------------- */

    [data-testid="stNumberInput"] input {
        background-color: #fffaf7 !important;
        color: #111111 !important;
    }


    /* --------------------------------------------------
       FORMS
    -------------------------------------------------- */

    [data-testid="stForm"] {
        background-color: #f8ece7 !important;

        border: 1px solid #9a6b62 !important;
        border-radius: 6px !important;

        padding: 20px !important;
    }


    /* --------------------------------------------------
       DATA TABLES
    -------------------------------------------------- */

    [data-testid="stDataFrame"] {
        background-color: #f6e5df !important;

        border: 1px solid #301718 !important;
        border-radius: 5px !important;

        overflow: hidden !important;
    }


    [data-testid="stDataFrame"] > div {
        background-color: #f6e5df !important;
    }


    /* --------------------------------------------------
       INFO / SUCCESS / WARNING BOXES
    -------------------------------------------------- */

    [data-testid="stAlert"] {
        background-color: #f3dfd8 !important;
        color: #1a1111 !important;

        border: 1px solid #7c4b45 !important;
        border-radius: 5px !important;
    }


    [data-testid="stAlert"] * {
        color: #1a1111 !important;
    }


    /* --------------------------------------------------
       CAPTIONS
    -------------------------------------------------- */

    .stCaptionContainer {
        color: #705955 !important;
    }


    /* --------------------------------------------------
       SLIDER
    -------------------------------------------------- */

    [data-testid="stSlider"] {
        color: #5f1719 !important;
    }


    /* --------------------------------------------------
       IMAGE / BANNER
    -------------------------------------------------- */

    [data-testid="stImage"] img {
        border-radius: 6px !important;
        border: 1px solid #5f1719 !important;
    }

    /* Hide only the broken sidebar collapse icon while sidebar is open */
[data-testid="stSidebarCollapseButton"] {
    display: none !important;
}

    </style>
    """,
    unsafe_allow_html=True
)


# ==================================================
# PERMANENT DATA STORAGE
# ==================================================

DATA_FILE = "math_club_data.json"


def load_data():

    if os.path.exists(DATA_FILE):

        try:

            with open(
                DATA_FILE,
                "r"
            ) as file:

                data = json.load(file)


            return data


        except (
            json.JSONDecodeError,
            OSError
        ):

            return {
                "starting_balance": 0.0,
                "events": [],
                "fundraisers": []
            }


    return {
        "starting_balance": 0.0,
        "events": [],
        "fundraisers": []
    }



def save_data():

    data = {

        "starting_balance":
            st.session_state.starting_balance,

        "events":
            st.session_state.events,

        "fundraisers":
            st.session_state.fundraisers
    }


    with open(
        DATA_FILE,
        "w"
    ) as file:

        json.dump(
            data,
            file,
            indent=4
        )


# ==================================================
# LOAD SAVED DATA
# ==================================================

if "data_loaded" not in st.session_state:

    saved_data = load_data()


    st.session_state.starting_balance = (
        saved_data.get(
            "starting_balance",
            0.0
        )
    )


    st.session_state.events = (
        saved_data.get(
            "events",
            []
        )
    )


    st.session_state.fundraisers = (
        saved_data.get(
            "fundraisers",
            []
        )
    )


    st.session_state.data_loaded = True


# ==================================================
# CALCULATE EVENT EXPENSES
# ==================================================

total_event_expenses = 0


for event in st.session_state.events:

    for expense in event["Expenses"]:

        total_event_expenses += (
            expense["Amount"]
        )


# ==================================================
# CALCULATE ACTUAL FUNDRAISING RESULTS
# ==================================================

total_fundraiser_revenue = 0
total_fundraiser_expenses = 0


for fundraiser in (
    st.session_state.fundraisers
):

    if len(
        fundraiser["Report"]
    ) > 0:

        total_fundraiser_revenue += (
            fundraiser["Report"][
                "Actual Revenue"
            ]
        )

        total_fundraiser_expenses += (
            fundraiser["Report"][
                "Actual Expenses"
            ]
        )


fundraiser_profit = (
    total_fundraiser_revenue
    - total_fundraiser_expenses
)


# ==================================================
# CURRENT BALANCE
# ==================================================

current_balance = (
    st.session_state.starting_balance
    - total_event_expenses
    + fundraiser_profit
)


# ==================================================
# NAVIGATION
# ==================================================

st.sidebar.title(
    "MATH CLUB"
)

st.sidebar.caption(
    "Financial Management"
)


page = st.sidebar.radio(
    "Navigation",

    [
        "Dashboard",
        "Events",
        "Fundraising",
        "Reports"
    ],

    label_visibility="collapsed"
)


# ==================================================
# PDF FUNCTION
# ==================================================

def generate_overall_report(
    events,
    fundraisers,
    starting_balance
):

    pdf_buffer = BytesIO()

    document = SimpleDocTemplate(
        pdf_buffer,
        pagesize=letter,
        rightMargin=45,
        leftMargin=45,
        topMargin=42,
        bottomMargin=42
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        alignment=TA_CENTER,
        fontSize=18,
        leading=22,
        spaceAfter=5
    )

    subtitle_style = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        alignment=TA_CENTER,
        fontSize=9,
        textColor=colors.grey,
        spaceAfter=15
    )

    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontSize=12,
        leading=14,
        spaceBefore=5,
        spaceAfter=7
    )

    normal_style = ParagraphStyle(
        "NormalText",
        parent=styles["BodyText"],
        fontSize=9,
        leading=12
    )

    question_style = ParagraphStyle(
        "Question",
        parent=styles["BodyText"],
        fontSize=9,
        leading=12,
        textColor=colors.black,
        spaceAfter=4
    )

    report = []


    # ==================================================
    # PAGE 1
    # FINANCIAL & EVENT OVERVIEW
    # ==================================================

    report.append(
        Paragraph(
            "Math Club Overall Event & Financial Report",
            title_style
        )
    )

    report.append(
        Paragraph(
            "Financial and event performance summary",
            subtitle_style
        )
    )


    # --------------------------------------------------
    # EVENT SPENDING
    # --------------------------------------------------

    total_spending = 0

    category_totals = {}

    for event in events:

        for expense in event["Expenses"]:

            amount = expense["Amount"]

            total_spending += amount

            category = expense["Category"]

            if category not in category_totals:
                category_totals[category] = 0

            category_totals[category] += amount


    # --------------------------------------------------
    # FUNDRAISING
    # --------------------------------------------------

    total_fundraising_revenue = 0
    total_fundraising_expenses = 0

    completed_fundraisers = []

    for fundraiser in fundraisers:

        if len(fundraiser["Report"]) > 0:

            completed_fundraisers.append(
                fundraiser
            )

            total_fundraising_revenue += (
                fundraiser["Report"][
                    "Actual Revenue"
                ]
            )

            total_fundraising_expenses += (
                fundraiser["Report"][
                    "Actual Expenses"
                ]
            )


    total_fundraising_profit = (
        total_fundraising_revenue
        - total_fundraising_expenses
    )


    remaining_balance = (
        starting_balance
        - total_spending
        + total_fundraising_profit
    )


    # --------------------------------------------------
    # FINANCIAL SUMMARY
    # --------------------------------------------------

    report.append(
        Paragraph(
            "Financial Summary",
            heading_style
        )
    )


    financial_data = [

        [
            "Starting Budget",
            f"${starting_balance:,.2f}"
        ],

        [
            "Event Spending",
            f"${total_spending:,.2f}"
        ],

        [
            "Fundraising Revenue",
            f"${total_fundraising_revenue:,.2f}"
        ],

        [
            "Fundraising Expenses",
            f"${total_fundraising_expenses:,.2f}"
        ],

        [
            "Net Fundraising Profit",
            f"${total_fundraising_profit:,.2f}"
        ],

        [
            "Current Balance",
            f"${remaining_balance:,.2f}"
        ]

    ]


    financial_table = Table(
        financial_data,
        colWidths=[220, 220]
    )


    financial_table.setStyle(
        TableStyle(
            [

                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.grey
                ),

                (
                    "BACKGROUND",
                    (0, 0),
                    (0, -1),
                    colors.whitesmoke
                ),

                (
                    "FONTNAME",
                    (0, 0),
                    (0, -1),
                    "Helvetica-Bold"
                ),

                (
                    "FONTSIZE",
                    (0, 0),
                    (-1, -1),
                    8
                ),

                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    4
                ),

                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    4
                )

            ]
        )
    )


    report.append(financial_table)

    report.append(
        Spacer(1, 10)
    )


    # --------------------------------------------------
    # COMPLETED EVENTS
    # --------------------------------------------------

    completed_events = []

    for event in events:

        if (
            "Report" in event
            and len(event["Report"]) > 0
        ):

            completed_events.append(event)


    # --------------------------------------------------
    # EVENT PERFORMANCE
    # --------------------------------------------------

    if len(completed_events) > 0:

        report.append(
            Paragraph(
                "Event Performance",
                heading_style
            )
        )


        event_rows = [

            [
                "Event",
                "Cost",
                "Attendance",
                "Cost / Person",
                "Rating"
            ]

        ]


        highest_attendance_event = None
        highest_attendance = -1

        highest_rating_event = None
        highest_rating = -1

        lowest_cost_event = None
        lowest_cost_per_person = None


        for event in completed_events:

            event_cost = 0

            for expense in event["Expenses"]:

                event_cost += expense["Amount"]


            actual = event["Report"].get(
                "Actual Attendance",
                0
            )

            rating = event["Report"].get(
                "Event Rating",
                0
            )


            if actual > 0:

                cost_per_person = (
                    event_cost / actual
                )

            else:

                cost_per_person = 0


            event_rows.append(
                [
                    event["Event"],
                    f"${event_cost:,.2f}",
                    str(actual),
                    f"${cost_per_person:,.2f}",
                    f"{rating}/5"
                ]
            )


            if actual > highest_attendance:

                highest_attendance = actual

                highest_attendance_event = (
                    event["Event"]
                )


            if rating > highest_rating:

                highest_rating = rating

                highest_rating_event = (
                    event["Event"]
                )


            if actual > 0:

                if (
                    lowest_cost_per_person is None
                    or cost_per_person
                    < lowest_cost_per_person
                ):

                    lowest_cost_per_person = (
                        cost_per_person
                    )

                    lowest_cost_event = (
                        event["Event"]
                    )


        event_table = Table(
            event_rows,
            repeatRows=1,
            colWidths=[
                130,
                75,
                80,
                90,
                60
            ]
        )


        event_table.setStyle(
            TableStyle(
                [

                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, 0),
                        colors.whitesmoke
                    ),

                    (
                        "FONTNAME",
                        (0, 0),
                        (-1, 0),
                        "Helvetica-Bold"
                    ),

                    (
                        "GRID",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.grey
                    ),

                    (
                        "FONTSIZE",
                        (0, 0),
                        (-1, -1),
                        8
                    ),

                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        4
                    ),

                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        4
                    )

                ]
            )
        )


        report.append(event_table)

        report.append(
            Spacer(1, 8)
        )


        # --------------------------------------------------
        # EVENT HIGHLIGHTS
        # --------------------------------------------------

        report.append(
            Paragraph(
                "Event Highlights",
                heading_style
            )
        )


        highlight_text = ""


        if highest_attendance_event is not None:

            highlight_text += (
                "<b>Highest attendance:</b> "
                + highest_attendance_event
                + " with "
                + str(highest_attendance)
                + " attendees.<br/>"
            )


        if highest_rating_event is not None:

            highlight_text += (
                "<b>Highest event rating:</b> "
                + highest_rating_event
                + " with "
                + str(highest_rating)
                + " / 5.<br/>"
            )


        if lowest_cost_event is not None:

            highlight_text += (
                "<b>Lowest cost per attendee:</b> "
                + lowest_cost_event
                + " at "
                + f"${lowest_cost_per_person:,.2f}"
                + " per attendee."
            )


        report.append(
            Paragraph(
                highlight_text,
                normal_style
            )
        )


        report.append(
            Spacer(1, 8)
        )


    # --------------------------------------------------
    # FUNDRAISING PERFORMANCE
    # --------------------------------------------------

    if len(completed_fundraisers) > 0:

        report.append(
            Paragraph(
                "Fundraising Performance",
                heading_style
            )
        )


        fundraiser_rows = [

            [
                "Fundraiser",
                "Revenue",
                "Expenses",
                "Profit"
            ]

        ]


        for fundraiser in completed_fundraisers:

            actual_revenue = (
                fundraiser["Report"][
                    "Actual Revenue"
                ]
            )

            actual_expenses = (
                fundraiser["Report"][
                    "Actual Expenses"
                ]
            )

            profit = (
                actual_revenue
                - actual_expenses
            )


            fundraiser_rows.append(
                [
                    fundraiser["Fundraiser"],
                    f"${actual_revenue:,.2f}",
                    f"${actual_expenses:,.2f}",
                    f"${profit:,.2f}"
                ]
            )


        fundraiser_table = Table(
            fundraiser_rows,
            repeatRows=1,
            colWidths=[
                160,
                95,
                95,
                95
            ]
        )


        fundraiser_table.setStyle(
            TableStyle(
                [

                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, 0),
                        colors.whitesmoke
                    ),

                    (
                        "FONTNAME",
                        (0, 0),
                        (-1, 0),
                        "Helvetica-Bold"
                    ),

                    (
                        "GRID",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.grey
                    ),

                    (
                        "FONTSIZE",
                        (0, 0),
                        (-1, -1),
                        8
                    ),

                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        4
                    ),

                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        4
                    )

                ]
            )
        )


        report.append(
            fundraiser_table
        )

        report.append(
            Spacer(1, 8)
        )


    # --------------------------------------------------
    # SPENDING BY CATEGORY
    # --------------------------------------------------

    if len(category_totals) > 0:

        report.append(
            Paragraph(
                "Spending by Category",
                heading_style
            )
        )


        category_data = [

            [
                "Category",
                "Amount"
            ]

        ]


        for category in category_totals:

            category_data.append(
                [
                    category,
                    f"${category_totals[category]:,.2f}"
                ]
            )


        category_table = Table(
            category_data,
            colWidths=[
                220,
                220
            ]
        )


        category_table.setStyle(
            TableStyle(
                [

                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, 0),
                        colors.whitesmoke
                    ),

                    (
                        "FONTNAME",
                        (0, 0),
                        (-1, 0),
                        "Helvetica-Bold"
                    ),

                    (
                        "GRID",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.grey
                    ),

                    (
                        "FONTSIZE",
                        (0, 0),
                        (-1, -1),
                        8
                    ),

                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        4
                    ),

                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        4
                    )

                ]
            )
        )


        report.append(category_table)

        report.append(
            Spacer(1, 8)
        )


    # --------------------------------------------------
    # CURRENT BUDGET POSITION
    # --------------------------------------------------

    report.append(
        Paragraph(
            "Current Budget Position",
            heading_style
        )
    )


    budget_text = (
        f"The Math Club began with "
        f"${starting_balance:,.2f}. "
        f"Regular events have used "
        f"${total_spending:,.2f}. "
        f"Completed fundraisers have produced "
        f"${total_fundraising_profit:,.2f} "
        f"in net fundraising profit. "
        f"The club's calculated current balance is "
        f"${remaining_balance:,.2f}."
    )


    report.append(
        Paragraph(
            budget_text,
            normal_style
        )
    )


    # ==================================================
    # PAGE 2
    # MEETING REVIEW & ACTION PLAN
    # ==================================================

    report.append(
        PageBreak()
    )


    report.append(
        Paragraph(
            "Meeting Review & Action Plan",
            title_style
        )
    )


    report.append(
        Paragraph(
            "Use this page during board meetings to reflect, plan, and assign next steps.",
            subtitle_style
        )
    )


    # --------------------------------------------------
    # HELPER FUNCTION FOR WRITING BOXES
    # --------------------------------------------------

    def writing_box(height):

        box = Table(
            [[""]],
            colWidths=[500],
            rowHeights=[height]
        )

        box.setStyle(
            TableStyle(
                [

                    (
                        "BOX",
                        (0, 0),
                        (-1, -1),
                        0.8,
                        colors.black
                    ),

                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, -1),
                        colors.white
                    )

                ]
            )
        )

        return box


    # --------------------------------------------------
    # 1. EVENT REFLECTION & IMPROVEMENTS
    # --------------------------------------------------

    report.append(
        Paragraph(
            "1. Event Reflection & Improvements",
            heading_style
        )
    )


    report.append(
        Paragraph(
            "<i>What worked well at our most recent event?</i><br/>"
            "<i>What should we change or improve for the next event?</i>",
            question_style
        )
    )


    report.append(
        writing_box(145)
    )


    report.append(
        Spacer(1, 12)
    )


    # --------------------------------------------------
    # 2. CLUB OUTREACH & ENGAGEMENT
    # --------------------------------------------------

    report.append(
        Paragraph(
            "2. Club Outreach & Engagement",
            heading_style
        )
    )


    report.append(
        Paragraph(
            "<i>How can we improve attendance, promotion, or member involvement?</i><br/>"
            "<i>Are there students or groups on campus we should reach out to?</i>",
            question_style
        )
    )


    report.append(
        writing_box(82)
    )


    report.append(
        Spacer(1, 12)
    )


    # --------------------------------------------------
    # 3. UPCOMING EVENT IDEAS
    # --------------------------------------------------

    report.append(
        Paragraph(
            "3. Upcoming Event Ideas",
            heading_style
        )
    )


    report.append(
        Paragraph(
            "<i>Ideas for future events, activities, collaborations, or fundraisers:</i>",
            question_style
        )
    )


    report.append(
        writing_box(82)
    )


    report.append(
        Spacer(1, 12)
    )


    # --------------------------------------------------
    # 4. SHORT-TERM GOALS
    # --------------------------------------------------

    report.append(
        Paragraph(
            "4. Short-Term Goals",
            heading_style
        )
    )


    report.append(
        Paragraph(
            "<i>What are our main goals before the next meeting?</i>",
            question_style
        )
    )


    goal_data = [

        [
            "1.",
            ""
        ],

        [
            "2.",
            ""
        ],

        [
            "3.",
            ""
        ]

    ]


    goal_table = Table(
        goal_data,
        colWidths=[
            25,
            475
        ],
        rowHeights=[
            27,
            27,
            27
        ]
    )


    goal_table.setStyle(
        TableStyle(
            [

                (
                    "LINEBELOW",
                    (1, 0),
                    (1, -1),
                    0.7,
                    colors.black
                ),

                (
                    "FONTNAME",
                    (0, 0),
                    (0, -1),
                    "Helvetica-Bold"
                ),

                (
                    "FONTSIZE",
                    (0, 0),
                    (-1, -1),
                    9
                ),

                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE"
                )

            ]
        )
    )


    report.append(
        goal_table
    )


    # ==================================================
    # BUILD PDF
    # ==================================================

    document.build(
        report
    )

    pdf_buffer.seek(0)

    return pdf_buffer

    # --------------------------------------------------
    # FUNDRAISING
    # --------------------------------------------------

    total_fundraising_revenue = 0

    total_fundraising_expenses = 0

    completed_fundraisers = []


    for fundraiser in fundraisers:

        if len(
            fundraiser["Report"]
        ) > 0:


            completed_fundraisers.append(
                fundraiser
            )


            total_fundraising_revenue += (
                fundraiser[
                    "Report"
                ][
                    "Actual Revenue"
                ]
            )


            total_fundraising_expenses += (
                fundraiser[
                    "Report"
                ][
                    "Actual Expenses"
                ]
            )


    total_fundraising_profit = (
        total_fundraising_revenue
        - total_fundraising_expenses
    )


    remaining_balance = (
        starting_balance
        - total_spending
        + total_fundraising_profit
    )


    # --------------------------------------------------
    # FINANCIAL SUMMARY
    # --------------------------------------------------

    report.append(
        Paragraph(
            "Financial Summary",
            heading_style
        )
    )


    financial_data = [

        [
            "Starting Budget",
            f"${starting_balance:,.2f}"
        ],

        [
            "Event Spending",
            f"${total_spending:,.2f}"
        ],

        [
            "Fundraising Revenue",
            f"${total_fundraising_revenue:,.2f}"
        ],

        [
            "Fundraising Expenses",
            f"${total_fundraising_expenses:,.2f}"
        ],

        [
            "Net Fundraising Profit",
            f"${total_fundraising_profit:,.2f}"
        ],

        [
            "Current Balance",
            f"${remaining_balance:,.2f}"
        ]

    ]


    financial_table = Table(
        financial_data,
        colWidths=[
            220,
            220
        ]
    )


    financial_table.setStyle(
        TableStyle(
            [

                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.grey
                ),

                (
                    "BACKGROUND",
                    (0, 0),
                    (0, -1),
                    colors.whitesmoke
                ),

                (
                    "FONTNAME",
                    (0, 0),
                    (0, -1),
                    "Helvetica-Bold"
                ),

                (
                    "PADDING",
                    (0, 0),
                    (-1, -1),
                    8
                )

            ]
        )
    )


    report.append(
        financial_table
    )


    report.append(
        Spacer(
            1,
            20
        )
    )


    # --------------------------------------------------
    # COMPLETED EVENTS
    # --------------------------------------------------

    completed_events = []


    for event in events:

        if (
            "Report" in event
            and len(
                event["Report"]
            ) > 0
        ):

            completed_events.append(
                event
            )


    # --------------------------------------------------
    # EVENT PERFORMANCE
    # --------------------------------------------------

    if len(
        completed_events
    ) > 0:


        report.append(
            Paragraph(
                "Event Performance",
                heading_style
            )
        )


        event_rows = [

            [
                "Event",
                "Cost",
                "Attendance",
                "Cost / Person",
                "Rating"
            ]

        ]


        highest_attendance_event = None
        highest_attendance = -1

        highest_rating_event = None
        highest_rating = -1

        lowest_cost_event = None
        lowest_cost_per_person = None

        total_attendance = 0
        total_expected = 0


        for event in completed_events:

            event_cost = 0


            for expense in (
                event["Expenses"]
            ):

                event_cost += (
                    expense["Amount"]
                )


            actual = (
                event["Report"].get(
                    "Actual Attendance",
                    0
                )
            )


            expected = (
                event["Report"].get(
                    "Expected Attendance",
                    0
                )
            )


            rating = (
                event["Report"].get(
                    "Event Rating",
                    0
                )
            )


            total_attendance += actual

            total_expected += expected


            if actual > 0:

                cost_per_person = (
                    event_cost
                    / actual
                )

            else:

                cost_per_person = 0


            event_rows.append(
                [
                    event["Event"],
                    f"${event_cost:,.2f}",
                    str(actual),
                    f"${cost_per_person:,.2f}",
                    f"{rating}/5"
                ]
            )


            if (
                actual
                > highest_attendance
            ):

                highest_attendance = (
                    actual
                )

                highest_attendance_event = (
                    event["Event"]
                )


            if (
                rating
                > highest_rating
            ):

                highest_rating = (
                    rating
                )

                highest_rating_event = (
                    event["Event"]
                )


            if actual > 0:

                if (
                    lowest_cost_per_person
                    is None
                    or cost_per_person
                    < lowest_cost_per_person
                ):

                    lowest_cost_per_person = (
                        cost_per_person
                    )

                    lowest_cost_event = (
                        event["Event"]
                    )


        event_table = Table(
            event_rows,
            repeatRows=1,

            colWidths=[
                130,
                75,
                80,
                90,
                60
            ]
        )


        event_table.setStyle(
            TableStyle(
                [

                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, 0),
                        colors.whitesmoke
                    ),

                    (
                        "FONTNAME",
                        (0, 0),
                        (-1, 0),
                        "Helvetica-Bold"
                    ),

                    (
                        "GRID",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.grey
                    ),

                    (
                        "PADDING",
                        (0, 0),
                        (-1, -1),
                        6
                    )

                ]
            )
        )


        report.append(
            event_table
        )


        report.append(
            Spacer(
                1,
                18
            )
        )


        # --------------------------------------------------
        # EVENT HIGHLIGHTS
        # --------------------------------------------------

        report.append(
            Paragraph(
                "Event Highlights",
                heading_style
            )
        )


        if (
            highest_attendance_event
            is not None
        ):

            report.append(
                Paragraph(
                    "<b>Highest attendance:</b> "
                    + highest_attendance_event
                    + " with "
                    + str(
                        highest_attendance
                    )
                    + " attendees.",
                    normal_style
                )
            )


            report.append(
                Spacer(
                    1,
                    7
                )
            )


        if (
            highest_rating_event
            is not None
        ):

            report.append(
                Paragraph(
                    "<b>Highest event rating:</b> "
                    + highest_rating_event
                    + " with "
                    + str(
                        highest_rating
                    )
                    + " / 5.",
                    normal_style
                )
            )


            report.append(
                Spacer(
                    1,
                    7
                )
            )


        if (
            lowest_cost_event
            is not None
        ):

            report.append(
                Paragraph(
                    "<b>Lowest cost per attendee:</b> "
                    + lowest_cost_event
                    + " at "
                    + f"${lowest_cost_per_person:,.2f}"
                    + " per attendee.",
                    normal_style
                )
            )


        report.append(
            Spacer(
                1,
                20
            )
        )


    # --------------------------------------------------
    # FUNDRAISING PERFORMANCE
    # --------------------------------------------------

    if len(
        completed_fundraisers
    ) > 0:


        report.append(
            Paragraph(
                "Fundraising Performance",
                heading_style
            )
        )


        fundraiser_rows = [

            [
                "Fundraiser",
                "Revenue",
                "Expenses",
                "Profit"
            ]

        ]


        highest_profit_name = None
        highest_profit = None


        for fundraiser in (
            completed_fundraisers
        ):


            actual_revenue = (
                fundraiser[
                    "Report"
                ][
                    "Actual Revenue"
                ]
            )


            actual_expenses = (
                fundraiser[
                    "Report"
                ][
                    "Actual Expenses"
                ]
            )


            profit = (
                actual_revenue
                - actual_expenses
            )


            fundraiser_rows.append(
                [
                    fundraiser[
                        "Fundraiser"
                    ],

                    f"${actual_revenue:,.2f}",

                    f"${actual_expenses:,.2f}",

                    f"${profit:,.2f}"
                ]
            )


            if (
                highest_profit
                is None
                or profit
                > highest_profit
            ):

                highest_profit = (
                    profit
                )

                highest_profit_name = (
                    fundraiser[
                        "Fundraiser"
                    ]
                )


        fundraiser_table = Table(
            fundraiser_rows,
            repeatRows=1,

            colWidths=[
                160,
                95,
                95,
                95
            ]
        )


        fundraiser_table.setStyle(
            TableStyle(
                [

                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, 0),
                        colors.whitesmoke
                    ),

                    (
                        "FONTNAME",
                        (0, 0),
                        (-1, 0),
                        "Helvetica-Bold"
                    ),

                    (
                        "GRID",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.grey
                    ),

                    (
                        "PADDING",
                        (0, 0),
                        (-1, -1),
                        6
                    )

                ]
            )
        )


        report.append(
            fundraiser_table
        )


        report.append(
            Spacer(
                1,
                15
            )
        )


        if (
            highest_profit_name
            is not None
        ):

            report.append(
                Paragraph(
                    "<b>Highest fundraiser profit:</b> "
                    + highest_profit_name
                    + " generated "
                    + f"${highest_profit:,.2f}"
                    + " in net funds.",
                    normal_style
                )
            )


        report.append(
            Spacer(
                1,
                20
            )
        )


    # --------------------------------------------------
    # EVENT SPENDING BY CATEGORY
    # --------------------------------------------------

    if len(
        category_totals
    ) > 0:


        report.append(
            Paragraph(
                "Event Spending by Category",
                heading_style
            )
        )


        category_data = [

            [
                "Category",
                "Amount"
            ]

        ]


        for category in (
            category_totals
        ):

            category_data.append(
                [
                    category,

                    f"${category_totals[category]:,.2f}"
                ]
            )


        category_table = Table(
            category_data,

            colWidths=[
                220,
                220
            ]
        )


        category_table.setStyle(
            TableStyle(
                [

                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, 0),
                        colors.whitesmoke
                    ),

                    (
                        "FONTNAME",
                        (0, 0),
                        (-1, 0),
                        "Helvetica-Bold"
                    ),

                    (
                        "GRID",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.grey
                    ),

                    (
                        "PADDING",
                        (0, 0),
                        (-1, -1),
                        7
                    )

                ]
            )
        )


        report.append(
            category_table
        )


        report.append(
            Spacer(
                1,
                20
            )
        )


    # --------------------------------------------------
    # CURRENT BUDGET POSITION
    # --------------------------------------------------

    report.append(
        Paragraph(
            "Current Budget Position",
            heading_style
        )
    )


    budget_text = (

        f"The Math Club began with "
        f"${starting_balance:,.2f}. "

        f"Regular events have used "
        f"${total_spending:,.2f}. "

        f"Completed fundraisers have produced "
        f"${total_fundraising_profit:,.2f} "
        f"in net fundraising profit. "

        f"The club's calculated current balance is "
        f"${remaining_balance:,.2f}."

    )


    report.append(
        Paragraph(
            budget_text,
            normal_style
        )
    )


    document.build(
        report
    )


    pdf_buffer.seek(0)


    return pdf_buffer


# ==================================================
# DASHBOARD
# ==================================================

if page == "Dashboard":

    st.title(
        "Math Club Finance Dashboard"
    )


    # --------------------------------------------------
    # ANNUAL BUDGET
    # --------------------------------------------------

    st.subheader(
        "Annual Budget"
    )


    starting_balance = (
        st.number_input(

            "Starting balance",

            min_value=0.0,

            value=float(
                st.session_state.starting_balance
            ),

            step=50.0,

            format="%.2f"
        )
    )


    # Save balance if changed

    if (
        starting_balance
        != st.session_state.starting_balance
    ):

        st.session_state.starting_balance = (
            starting_balance
        )

        save_data()


    current_balance = (
        st.session_state.starting_balance
        - total_event_expenses
        + fundraiser_profit
    )


    # --------------------------------------------------
    # OVERVIEW
    # --------------------------------------------------

    st.subheader(
        "Overview"
    )


    col1, col2, col3 = (
        st.columns(3)
    )


    with col1:

        st.metric(
            "Starting Balance",
            f"${st.session_state.starting_balance:,.2f}"
        )


    with col2:

        st.metric(
            "Event Expenses",
            f"${total_event_expenses:,.2f}"
        )


    with col3:

        st.metric(
            "Available Balance",
            f"${current_balance:,.2f}"
        )


    # --------------------------------------------------
    # FUNDRAISING OVERVIEW
    # --------------------------------------------------

    if (
        total_fundraiser_revenue > 0
        or total_fundraiser_expenses > 0
    ):


        st.write(
            "#### Fundraising"
        )


        col1, col2, col3 = (
            st.columns(3)
        )


        with col1:

            st.metric(
                "Fundraising Revenue",
                f"${total_fundraiser_revenue:,.2f}"
            )


        with col2:

            st.metric(
                "Fundraising Expenses",
                f"${total_fundraiser_expenses:,.2f}"
            )


        with col3:

            st.metric(
                "Net Fundraising",
                f"${fundraiser_profit:,.2f}"
            )


    st.divider()


    # --------------------------------------------------
    # EVENT SUMMARY
    # --------------------------------------------------

    st.subheader(
        "Events"
    )


    if len(
        st.session_state.events
    ) > 0:


        event_summary = []


        for event in (
            st.session_state.events
        ):


            event_total = 0


            for expense in (
                event["Expenses"]
            ):

                event_total += (
                    expense["Amount"]
                )


            event_summary.append(
                {

                    "Event":
                        event["Event"],

                    "Expenses":
                        len(
                            event["Expenses"]
                        ),

                    "Total Cost":
                        event_total

                }
            )


        st.dataframe(
            event_summary,
            use_container_width=True,
            hide_index=True,

            column_config={

                "Total Cost":
                    st.column_config.NumberColumn(
                        "Total Cost",
                        format="$%.2f"
                    )

            }
        )


    else:

        st.info(
            "No events have been added yet."
        )


# ==================================================
# EVENTS
# ==================================================

elif page == "Events":


    st.title(
        "Events"
    )


    st.caption(
        "Create events and track individual expenses"
    )


    st.divider()


    # --------------------------------------------------
    # CREATE EVENT
    # --------------------------------------------------

    st.subheader(
        "Create Event"
    )


    with st.form(
        "create_event",
        clear_on_submit=True
    ):


        event_name = (
            st.text_input(
                "Event name",
                placeholder="Example: Math Made Sweet"
            )
        )


        create_event = (
            st.form_submit_button(
                "Create event"
            )
        )


        if create_event:


            if (
                event_name.strip()
                == ""
            ):

                st.warning(
                    "Enter an event name."
                )


            else:

                new_event = {

                    "Event":
                        event_name,

                    "Expenses":
                        [],

                    "Report":
                        {}

                }


                st.session_state.events.append(
                    new_event
                )


                # SAVE PERMANENTLY

                save_data()


                st.success(
                    event_name
                    + " was created."
                )


    st.divider()


    # --------------------------------------------------
    # MANAGE EVENT
    # --------------------------------------------------

    st.subheader(
        "Manage Event"
    )


    if len(
        st.session_state.events
    ) == 0:


        st.info(
            "Create an event to begin tracking expenses."
        )


    else:


        event_names = []


        for event in (
            st.session_state.events
        ):

            event_names.append(
                event["Event"]
            )


        selected_event_name = (
            st.selectbox(

                "Select event",

                event_names,

                index=None,

                placeholder="Choose an event"
            )
        )


        if (
            selected_event_name
            is not None
        ):


            selected_event = None


            for event in (
                st.session_state.events
            ):

                if (
                    event["Event"]
                    == selected_event_name
                ):

                    selected_event = (
                        event
                    )


            st.write(
                "### "
                + selected_event_name
            )


            # --------------------------------------------------
            # ADD EXPENSE
            # --------------------------------------------------

            st.write(
                "#### Add Expense"
            )


            with st.form(
                "expense_form",
                clear_on_submit=True
            ):


                col1, col2 = (
                    st.columns(2)
                )


                with col1:


                    category = (
                        st.selectbox(

                            "Category",

                            [
                                "Food",
                                "Decorations",
                                "Equipment",
                                "Prizes",
                                "Supplies",
                                "Marketing",
                                "Other"
                            ]
                        )
                    )


                with col2:


                    amount = (
                        st.number_input(

                            "Amount",

                            min_value=0.0,

                            step=1.0,

                            format="%.2f"
                        )
                    )


                description = (
                    st.text_input(

                        "Description",

                        placeholder="Example: Pizza"
                    )
                )


                add_expense = (
                    st.form_submit_button(
                        "Add expense"
                    )
                )


                if add_expense:


                    if amount == 0:

                        st.warning(
                            "Enter an expense amount."
                        )


                    else:


                        expense = {

                            "Category":
                                category,

                            "Description":
                                description,

                            "Amount":
                                amount

                        }


                        selected_event[
                            "Expenses"
                        ].append(
                            expense
                        )


                        # SAVE PERMANENTLY

                        save_data()


                        st.success(
                            "Expense added."
                        )


            # --------------------------------------------------
            # EXPENSES
            # --------------------------------------------------

            st.write(
                "#### Expenses"
            )


            if len(
                selected_event[
                    "Expenses"
                ]
            ) > 0:


                st.dataframe(

                    selected_event[
                        "Expenses"
                    ],

                    use_container_width=True,

                    hide_index=True,

                    column_config={

                        "Amount":
                            st.column_config.NumberColumn(

                                "Amount",

                                format="$%.2f"
                            )

                    }
                )


                event_total = 0


                for expense in (
                    selected_event[
                        "Expenses"
                    ]
                ):

                    event_total += (
                        expense["Amount"]
                    )


                st.metric(
                    "Event Total",
                    f"${event_total:,.2f}"
                )


            else:

                st.caption(
                    "No expenses recorded for this event."
                )


            # --------------------------------------------------
            # DELETE EVENT
            # --------------------------------------------------

            st.divider()


            st.write(
                "#### Delete Event"
            )


            st.caption(
                "Deleting an event will also delete "
                "its expenses and report."
            )


            if st.button(
                "Delete "
                + selected_event_name
            ):


                st.session_state.events.remove(
                    selected_event
                )


                # SAVE DELETION

                save_data()


                st.rerun()


# ==================================================
# FUNDRAISING
# ==================================================

elif page == "Fundraising":


    st.title(
        "Fundraising"
    )


    st.caption(
        "Plan fundraisers and record actual financial results"
    )


    st.divider()


    # --------------------------------------------------
    # PLAN FUNDRAISER
    # --------------------------------------------------

    st.subheader(
        "Plan Fundraiser"
    )


    st.caption(
        "Planning figures do not affect the club's actual balance."
    )


    with st.form(
        "fundraiser_plan",
        clear_on_submit=True
    ):


        fundraiser_name = (
            st.text_input(

                "Fundraiser name",

                placeholder="Example: Pi Day Bake Sale"
            )
        )


        col1, col2 = (
            st.columns(2)
        )


        with col1:


            predicted_expenses = (
                st.number_input(

                    "Predicted expenses",

                    min_value=0.0,

                    step=1.0,

                    format="%.2f"
                )
            )


        with col2:


            predicted_revenue = (
                st.number_input(

                    "Predicted revenue",

                    min_value=0.0,

                    step=1.0,

                    format="%.2f"
                )
            )


        predicted_profit = (
            predicted_revenue
            - predicted_expenses
        )


        st.write(
            "Predicted profit: "
            + f"${predicted_profit:,.2f}"
        )


        plan_fundraiser = (
            st.form_submit_button(
                "Plan fundraiser"
            )
        )


        if plan_fundraiser:


            if (
                fundraiser_name.strip()
                == ""
            ):

                st.warning(
                    "Enter a fundraiser name."
                )


            else:


                new_fundraiser = {

                    "Fundraiser":
                        fundraiser_name,

                    "Predicted Expenses":
                        predicted_expenses,

                    "Predicted Revenue":
                        predicted_revenue,

                    "Report":
                        {}

                }


                st.session_state.fundraisers.append(
                    new_fundraiser
                )


                # SAVE PERMANENTLY

                save_data()


                st.success(
                    fundraiser_name
                    + " was added to the fundraising plan."
                )


    st.divider()


    # --------------------------------------------------
    # FUNDRAISERS
    # --------------------------------------------------

    st.subheader(
        "Fundraisers"
    )


    if len(
        st.session_state.fundraisers
    ) == 0:


        st.info(
            "No fundraisers have been planned yet."
        )


    else:


        fundraiser_names = []


        for fundraiser in (
            st.session_state.fundraisers
        ):

            fundraiser_names.append(
                fundraiser[
                    "Fundraiser"
                ]
            )


        selected_fundraiser_name = (
            st.selectbox(

                "Select fundraiser",

                fundraiser_names,

                index=None,

                placeholder="Choose a fundraiser"
            )
        )


        if (
            selected_fundraiser_name
            is not None
        ):


            selected_fundraiser = None


            for fundraiser in (
                st.session_state.fundraisers
            ):

                if (
                    fundraiser[
                        "Fundraiser"
                    ]
                    == selected_fundraiser_name
                ):

                    selected_fundraiser = (
                        fundraiser
                    )


            st.write(
                "### "
                + selected_fundraiser_name
            )


            predicted_profit = (

                selected_fundraiser[
                    "Predicted Revenue"
                ]

                -

                selected_fundraiser[
                    "Predicted Expenses"
                ]

            )


            col1, col2, col3 = (
                st.columns(3)
            )


            with col1:


                st.metric(
                    "Predicted Revenue",

                    f"${selected_fundraiser['Predicted Revenue']:,.2f}"
                )


            with col2:


                st.metric(
                    "Predicted Expenses",

                    f"${selected_fundraiser['Predicted Expenses']:,.2f}"
                )


            with col3:


                st.metric(
                    "Predicted Profit",

                    f"${predicted_profit:,.2f}"
                )


            # --------------------------------------------------
            # FUNDRAISER REPORT
            # --------------------------------------------------

            st.write(
                "#### Fundraiser Report"
            )


            if len(
                selected_fundraiser[
                    "Report"
                ]
            ) == 0:


                st.caption(
                    "Add the actual results after the fundraiser is completed."
                )


                with st.form(
                    "fundraiser_report"
                ):


                    actual_revenue = (
                        st.number_input(

                            "Actual revenue",

                            min_value=0.0,

                            step=1.0,

                            format="%.2f"
                        )
                    )


                    actual_expenses = (
                        st.number_input(

                            "Actual expenses",

                            min_value=0.0,

                            step=1.0,

                            format="%.2f"
                        )
                    )


                    participants = (
                        st.number_input(

                            "Customers / participants",

                            min_value=0,

                            step=1
                        )
                    )


                    fundraiser_notes = (
                        st.text_area(

                            "Notes",

                            placeholder=(
                                "What worked well? "
                                "What would you change?"
                            )
                        )
                    )


                    save_fundraiser_report = (
                        st.form_submit_button(
                            "Add report"
                        )
                    )


                    if save_fundraiser_report:


                        selected_fundraiser[
                            "Report"
                        ] = {

                            "Actual Revenue":
                                actual_revenue,

                            "Actual Expenses":
                                actual_expenses,

                            "Participants":
                                participants,

                            "Notes":
                                fundraiser_notes

                        }


                        # SAVE REPORT PERMANENTLY

                        save_data()


                        st.success(
                            "Fundraiser report saved."
                        )


                        st.rerun()


            else:


                actual_revenue = (
                    selected_fundraiser[
                        "Report"
                    ][
                        "Actual Revenue"
                    ]
                )


                actual_expenses = (
                    selected_fundraiser[
                        "Report"
                    ][
                        "Actual Expenses"
                    ]
                )


                actual_profit = (
                    actual_revenue
                    - actual_expenses
                )


                col1, col2, col3 = (
                    st.columns(3)
                )


                with col1:


                    st.metric(
                        "Actual Revenue",
                        f"${actual_revenue:,.2f}"
                    )


                with col2:


                    st.metric(
                        "Actual Expenses",
                        f"${actual_expenses:,.2f}"
                    )


                with col3:


                    st.metric(
                        "Actual Profit",
                        f"${actual_profit:,.2f}"
                    )


                difference = (
                    actual_profit
                    - predicted_profit
                )


                st.write(
                    "**Difference from predicted profit:** "
                    + f"${difference:,.2f}"
                )


                st.caption(
                    "These actual results are included in the club balance."
                )


            # --------------------------------------------------
            # DELETE FUNDRAISER
            # --------------------------------------------------

            st.divider()


            if st.button(
                "Delete "
                + selected_fundraiser_name
            ):


                st.session_state.fundraisers.remove(
                    selected_fundraiser
                )


                # SAVE DELETION

                save_data()


                st.rerun()


# ==================================================
# REPORTS
# ==================================================

elif page == "Reports":


    st.title(
        "Event Reports"
    )


    st.caption(
        "Record and analyze completed Math Club events"
    )


    st.divider()


    # --------------------------------------------------
    # COUNT COMPLETED REPORTS
    # --------------------------------------------------

    completed_reports = 0


    for event in (
        st.session_state.events
    ):

        if (
            "Report" in event
            and len(
                event["Report"]
            ) > 0
        ):

            completed_reports += 1


    # --------------------------------------------------
    # EVENT REPORTS
    # --------------------------------------------------

    if len(
        st.session_state.events
    ) == 0:


        st.info(
            "Create an event before completing an event report."
        )


    else:


        st.subheader(
            "Select Event"
        )


        report_event_names = []


        for event in (
            st.session_state.events
        ):

            report_event_names.append(
                event["Event"]
            )


        report_event_name = (
            st.selectbox(

                "Event",

                report_event_names,

                index=None,

                placeholder="Choose an event"
            )
        )


        if (
            report_event_name
            is not None
        ):


            report_event = None


            for event in (
                st.session_state.events
            ):

                if (
                    event["Event"]
                    == report_event_name
                ):

                    report_event = (
                        event
                    )


            if (
                "Report"
                not in report_event
            ):

                report_event[
                    "Report"
                ] = {}


            # --------------------------------------------------
            # EVENT COST
            # --------------------------------------------------

            event_total = 0


            for expense in (
                report_event[
                    "Expenses"
                ]
            ):

                event_total += (
                    expense["Amount"]
                )


            st.divider()


            st.subheader(
                report_event_name
            )


            col1, col2 = (
                st.columns(2)
            )


            with col1:


                st.metric(
                    "Event Cost",
                    f"${event_total:,.2f}"
                )


            with col2:


                st.metric(
                    "Recorded Expenses",

                    len(
                        report_event[
                            "Expenses"
                        ]
                    )
                )


            st.divider()


            # --------------------------------------------------
            # POST-EVENT REPORT
            # --------------------------------------------------

            st.subheader(
                "Post-Event Report"
            )


            with st.form(
                "event_report_form"
            ):


                # ATTENDANCE

                st.write(
                    "#### Attendance"
                )


                col1, col2 = (
                    st.columns(2)
                )


                with col1:


                    expected_attendance = (
                        st.number_input(

                            "Expected attendance",

                            min_value=0,

                            step=1,

                            value=int(
                                report_event[
                                    "Report"
                                ].get(
                                    "Expected Attendance",
                                    0
                                )
                            )
                        )
                    )


                with col2:


                    actual_attendance = (
                        st.number_input(

                            "Actual attendance",

                            min_value=0,

                            step=1,

                            value=int(
                                report_event[
                                    "Report"
                                ].get(
                                    "Actual Attendance",
                                    0
                                )
                            )
                        )
                    )


                # FOOD

                st.write(
                    "#### Food"
                )


                food_options = [

                    "Just enough",
                    "Too much",
                    "Not enough",
                    "No food was served"

                ]


                old_food = (
                    report_event[
                        "Report"
                    ].get(
                        "Food Result"
                    )
                )


                if (
                    old_food
                    in food_options
                ):

                    food_index = (
                        food_options.index(
                            old_food
                        )
                    )

                else:

                    food_index = None


                food_result = (
                    st.selectbox(

                        "How was the amount of food?",

                        food_options,

                        index=food_index,

                        placeholder="Select an option"
                    )
                )


                leftover_food = (
                    st.number_input(

                        "Estimated leftover servings",

                        min_value=0,

                        step=1,

                        value=int(
                            report_event[
                                "Report"
                            ].get(
                                "Leftover Servings",
                                0
                            )
                        )
                    )
                )


                # EVENT OUTCOME

                st.write(
                    "#### Event Outcome"
                )


                event_rating = (
                    st.slider(

                        "Overall event success",

                        min_value=1,

                        max_value=5,

                        value=int(
                            report_event[
                                "Report"
                            ].get(
                                "Event Rating",
                                3
                            )
                        )
                    )
                )


                repeat_options = [

                    "Yes",
                    "Maybe",
                    "No"

                ]


                old_repeat = (
                    report_event[
                        "Report"
                    ].get(
                        "Host Again"
                    )
                )


                if (
                    old_repeat
                    in repeat_options
                ):

                    repeat_index = (
                        repeat_options.index(
                            old_repeat
                        )
                    )

                else:

                    repeat_index = None


                would_repeat = (
                    st.selectbox(

                        "Would you host this event again?",

                        repeat_options,

                        index=repeat_index,

                        placeholder="Select an option"
                    )
                )


                # NOTES

                st.write(
                    "#### Notes"
                )


                notes = (
                    st.text_area(

                        "Event notes",

                        value=report_event[
                            "Report"
                        ].get(
                            "Notes",
                            ""
                        ),

                        placeholder=(
                            "What worked well? "
                            "What should change next time?"
                        )
                    )
                )


                save_report = (
                    st.form_submit_button(
                        "Save report"
                    )
                )


                if save_report:


                    if (
                        food_result is None
                        or would_repeat is None
                    ):

                        st.warning(
                            "Complete the food and event outcome questions."
                        )


                    else:


                        report_event[
                            "Report"
                        ] = {

                            "Expected Attendance":
                                expected_attendance,

                            "Actual Attendance":
                                actual_attendance,

                            "Food Result":
                                food_result,

                            "Leftover Servings":
                                leftover_food,

                            "Event Rating":
                                event_rating,

                            "Host Again":
                                would_repeat,

                            "Notes":
                                notes

                        }


                        # SAVE REPORT PERMANENTLY

                        save_data()


                        st.success(
                            "Report saved."
                        )


            # --------------------------------------------------
            # EVENT ANALYSIS
            # --------------------------------------------------

            if len(
                report_event[
                    "Report"
                ]
            ) > 0:


                st.divider()


                st.subheader(
                    "Event Analysis"
                )


                actual = (
                    report_event[
                        "Report"
                    ][
                        "Actual Attendance"
                    ]
                )


                expected = (
                    report_event[
                        "Report"
                    ][
                        "Expected Attendance"
                    ]
                )


                if actual > 0:

                    cost_per_person = (
                        event_total
                        / actual
                    )

                else:

                    cost_per_person = 0


                if expected > 0:

                    attendance_rate = (
                        actual
                        / expected
                    ) * 100

                else:

                    attendance_rate = 0


                col1, col2, col3 = (
                    st.columns(3)
                )


                with col1:


                    st.metric(
                        "Actual Attendance",
                        actual
                    )


                with col2:


                    st.metric(
                        "Attendance vs. Expected",
                        f"{attendance_rate:.1f}%"
                    )


                with col3:


                    st.metric(
                        "Cost Per Attendee",
                        f"${cost_per_person:,.2f}"
                    )


                st.write(
                    "#### Food Result"
                )


                st.write(
                    report_event[
                        "Report"
                    ][
                        "Food Result"
                    ]
                )


                st.write(
                    "#### Event Rating"
                )


                st.write(
                    str(
                        report_event[
                            "Report"
                        ][
                            "Event Rating"
                        ]
                    )
                    + " / 5"
                )


                st.write(
                    "#### Host Again"
                )


                st.write(
                    report_event[
                        "Report"
                    ][
                        "Host Again"
                    ]
                )


                if (
                    report_event[
                        "Report"
                    ][
                        "Notes"
                    ]
                    != ""
                ):


                    st.write(
                        "#### Notes"
                    )


                    st.write(
                        report_event[
                            "Report"
                        ][
                            "Notes"
                        ]
                    )


    # ==================================================
    # OVERALL PDF REPORT
    # ==================================================

    st.divider()


    st.subheader(
        "Overall Report"
    )


    st.caption(
        "Generate a PDF comparing completed events, "
        "fundraising results, and the current budget."
    )


    if completed_reports < 2:


        st.button(
            "Generate Overall Report",
            disabled=True
        )


        st.caption(
            "Complete reports for at least 2 events "
            "to generate an overall report. "
            + str(
                completed_reports
            )
            + " of 2 completed."
        )


    else:


        if st.button(
            "Generate Overall Report"
        ):


            pdf = (
                generate_overall_report(

                    st.session_state.events,

                    st.session_state.fundraisers,

                    st.session_state.starting_balance

                )
            )


            st.session_state[
                "overall_pdf"
            ] = (
                pdf.getvalue()
            )


        if (
            "overall_pdf"
            in st.session_state
        ):


            st.success(
                "Overall report generated."
            )


            st.download_button(

                label="Download PDF Report",

                data=st.session_state[
                    "overall_pdf"
                ],

                file_name=(
                    "math_club_overall_report.pdf"
                ),

                mime="application/pdf"
            )
