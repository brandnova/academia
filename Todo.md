### Final runthrough checklist once the MVP is done:

1. Run through the project and tighten security (including rate limiting, proper pagination, proper access and refresh token lifetimes, etc.)
2. Prepare the project for massive traffic by running through a list of things to do, I learned that projects with high traffic usually cache heavily. List some other things to do for this.
3. 




Two other things to note, we'll tackle them later or when you feel they are needed:

- Content seed command: We might want to seed the database with placeholder content as we are building, so a management command might come in handy, one we can update as we add new models so we can populate it with placeholder content for testing.
- How to search and source a list of schools in Nigeria: I definitely intend to curate a list of all schools in Nigeria, colleges, polytechnics, and universities. This will require some work as there is no single source for this info. It is also among the things I plan to open an endpoint for so that devs can access an organized list of schools with other info about them, like location and so on. There might also be a need for a way to allow users to submit their school if it is not on the list (prolly I missed a few), this would require verification and actually updating the database with that school. And given the future goal for the project, I might need to contact or visit the school in person to get actual updated info.


