/**
 * @swagger
 * /api/v1/about-us:
 *   get:
 *     summary: Get About Us content
 *     description: >
 *       No API-layer auth enforced. Thin re-export of the handlers defined in
 *       /api/v1/compliance/about-us — identical behavior and response shape.
 *     tags: [CMS - About Us]
 *     responses:
 *       200:
 *         description: About Us content fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     title: { type: string }
 *                     youtubeLink: { type: string }
 *                     introVideoUrl: { type: string }
 *                     aboutUsContent: { type: string }
 *                     story:
 *                       type: object
 *                       properties:
 *                         title: { type: string }
 *                         name: { type: string }
 *                         designation: { type: string }
 *                         imageUrl: { type: string }
 *                         description: { type: string }
 *                     about_us_title: { type: string }
 *                     about_us: { type: string }
 *                     youtube_video: { type: string }
 *                     introduction_video_url: { type: string }
 *                     story_title: { type: string }
 *                     stories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name: { type: string }
 *                           designation: { type: string }
 *                           image: { type: string }
 *                           description: { type: string }
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /api/v1/about-us:
 *   post:
 *     summary: Create or update About Us content
 *     description: >
 *       No API-layer auth enforced. Thin re-export of the handlers defined in
 *       /api/v1/compliance/about-us — identical behavior and response shape.
 *       Accepts multipart/form-data. Uploaded files are saved under
 *       /public/uploads/about-us.
 *     tags: [CMS - About Us]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               youtubeLink: { type: string }
 *               aboutUsContent: { type: string }
 *               storyTitle: { type: string }
 *               storyName: { type: string }
 *               storyDesignation: { type: string }
 *               storyDescription: { type: string }
 *               introVideo: { type: string, format: binary }
 *               storyImage: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: About Us content saved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "About Us saved successfully." }
 *                 data: { type: object }
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /api/v1/about-us:
 *   delete:
 *     summary: Delete About Us content
 *     description: >
 *       No API-layer auth enforced. Thin re-export of the handlers defined in
 *       /api/v1/compliance/about-us — identical behavior and response shape.
 *       Also removes any uploaded intro video / story image files.
 *     tags: [CMS - About Us]
 *     responses:
 *       200:
 *         description: About Us content deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "About Us content deleted successfully." }
 *       500:
 *         description: Internal server error.
 */
export { GET, POST, DELETE } from "../compliance/about-us/route";
