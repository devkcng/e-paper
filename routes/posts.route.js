import express from "express";
import articleService from "../services/article.service.js";
import commentService from "../services/comment.service.js";
import userService from "../services/user.service.js";
import authMiddleware from "../auth/middlewares/authMiddleware.js";
import moment from 'moment';

const router = express.Router();

router.get("/", async function (req, res) {
  const articles = await articleService.getAllArticles();
  res.render("posts", { articles: articles, title: "All posts" });
});

router.get("/byCat", async function (req, res) {
  const name = req.query.categoryname || "";
  const current_page = req.query.page || 1;
  const limit = 6;
  const offSet = (+current_page - 1) * limit;
  const total = await articleService.countArticlesByCategory(name);
  const totalPages = Math.ceil(total / limit);
  const pageNumber = [];
  const maxVisiblePage = 5;
  const calculatePossibleStartPage = Math.max(
    0,
    current_page - Math.floor(maxVisiblePage - 2)
  );
  const startPage =
    calculatePossibleStartPage < maxVisiblePage
      ? calculatePossibleStartPage
      : calculatePossibleStartPage -
        (calculatePossibleStartPage - maxVisiblePage);
  const endPage = Math.min(totalPages, startPage + maxVisiblePage);
  // console.log(endPage);
  for (let i = startPage; i < endPage; i++) {
    pageNumber.push({
      value: i + 1,
      catName: name,
      active: i + 1 === parseInt(current_page),
    });
  }

  //Arrange premium post for supscription users
  const isPremium = true;
  const articles = await articleService.getArticlesByCategory(
    name,
    limit,
    offSet,
    isPremium
  );
  // console.log(name);
  res.render("posts", {
    hasPagination: totalPages > 1,
    articles: articles,
    title: name,
    catName: name,
    pageNumber: pageNumber,
    totalPages: totalPages,
    hasNextPage: current_page < totalPages,
    hasPreviousPage: current_page > 1,
    nextPage: parseInt(current_page) + 1,
    previousPage: parseInt(current_page) - 1,
    isByCategory: true,
  });
});

router.get("/byTag", async function (req, res) {
  const name = req.query.name || "";
  const current_page = req.query.page || 1;
  const limit = 6;
  const offSet = (+current_page - 1) * limit;
  const total = await articleService.countArticlesByTagName(name);
  const totalPages = Math.ceil(total / limit);
  const pageNumber = [];
  const maxVisiblePage = 5;
  const calculatePossibleStartPage = Math.max(
    0,
    current_page - Math.floor(maxVisiblePage - 2)
  );
  const startPage =
    calculatePossibleStartPage < maxVisiblePage
      ? calculatePossibleStartPage
      : calculatePossibleStartPage -
        (calculatePossibleStartPage - maxVisiblePage);
  const endPage = Math.min(totalPages, startPage + maxVisiblePage);
  for (let i = startPage; i < endPage; i++) {
    pageNumber.push({
      value: i + 1,
      tagName: name,
      active: i + 1 === parseInt(current_page),
    });
  }

  //Arrange premium post for supscription users
  const isPremium = true;
  const articles = await articleService.getArticlesByTag(
    name,
    limit,
    offSet,
    isPremium
  );
  res.render("posts", {
    articles: articles,
    tagName: name,
    title: "#" + name,
    hasPagination: totalPages > 1,
    articles: articles,
    pageNumber: pageNumber,
    totalPages: totalPages,
    hasNextPage: current_page < totalPages,
    hasPreviousPage: current_page > 1,
    nextPage: parseInt(current_page) + 1,
    previousPage: parseInt(current_page) - 1,
    isByTagName: true,
  });
});

router.get("/search", async function (req, res) {
  const keyword = req.query.keyword || "";
  const current_page = req.query.page || 1;
  const limit = 6;
  const offSet = (+current_page - 1) * limit;
  const total = await articleService.countArticlesByKeyword(keyword);
  const totalPages = Math.ceil(total / limit);
  const pageNumber = [];
  const maxVisiblePage = 5;
  const calculatePossibleStartPage = Math.max(
    0,
    current_page - Math.floor(maxVisiblePage - 2)
  );
  const startPage =
    Math.max(0, current_page - Math.floor(maxVisiblePage - 2)) < maxVisiblePage
      ? calculatePossibleStartPage
      : calculatePossibleStartPage +
        (calculatePossibleStartPage - maxVisiblePage);
  const endPage = Math.min(totalPages, startPage + maxVisiblePage);
  for (let i = startPage; i < endPage; i++) {
    pageNumber.push({
      value: i + 1,
      keyword: keyword,
      active: i + 1 === parseInt(current_page),
    });
  }
  //Arrange premium post for supscription users
  const isPremium = true;
  const articles = await articleService.searchArticlesByKeyword(
    keyword,
    limit,
    offSet,
    isPremium
  );
  res.render("posts", {
    articles: articles,
    keyword: keyword,
    title: "#" + keyword,
    hasPagination: totalPages > 1,
    articles: articles,
    pageNumber: pageNumber,
    totalPages: totalPages,
    hasNextPage: current_page < totalPages,
    hasPreviousPage: current_page > 1,
    nextPage: parseInt(current_page) + 1,
    previousPage: parseInt(current_page) - 1,
    isByKeyword: true,
  });
});
router.get("/detail", async function (req, res) {
  let user = null;
  if (req.user) {
    user = await userService.getById(req.user.id);
  }
  const id = req.query.id;
  console.log(id);
  const listComment = await commentService.getCommentByArticleId(id);

  // Format ngày giờ cho comment
  listComment.forEach((comment) => {
    comment.comment_date = moment(comment.comment_date).format(
      "MMMM Do YYYY, h:mm:ss a"
    );
  });

  const detail = await articleService.getArticleById(id);

  // Kiểm tra quyền truy cập bài viết Premium
  if (detail.article_is_premium === 1) {
    if (!user) {
      // Người dùng chưa đăng nhập
      return res.redirect("/login");
    }
    if (user[0].role === "guest") {
      // Người dùng là "guest"
      return res.redirect("/account-setting/myprofile");
    }
  }

  const relatedArticles = await articleService.getRelatedArticleByCategory(
    detail.category_name,
    detail.article_id,
    6
  );

  // Render trang chi tiết bài viết
  res.render("article-detail", {
    article_id: detail.article_id,
    id: detail.article_id,
    title: detail.article_title,
    content: detail.article_content,
    img_url: detail.article_image_url,
    isPremium: detail.article_is_premium,
    author: detail.author_name,
    category: detail.category_name,
    tags: detail.article_tags,
    published_date: detail.article_publish_date,
    relatedArticles: relatedArticles,
    listComment: listComment,
    numberofComment: listComment.length,
  });
});


router.post("/add-comment",authMiddleware.ensureAuthenticated, async function (req, res) {
  const userId = req.user.id;
  const { articleId, content, comment_date } = req.body;
  console.log(articleId, userId, content, comment_date);
  const result = await commentService.addComment(
    articleId,
    userId,
    content,
    comment_date
  );
  if (!result.success) {
    return res.json({
      success: false,
      message: "Unable to add comment",
      error: result.error,
    });
  }
  res.json({
    success: true,
    articleId,
    userId,
    content,
    comment_date,
    userName: result.userName,
  });
});
export default router;
