import express from "express";
import { engine } from "express-handlebars";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import formatDateTime from "./helpers/formatDateTime.js";
import articlesmanagementRouter from "./routes/admin/articles.route.js";
import writerArticleMangeRouter from "./routes/writer/articleMange.route.js";
import writerCreateArticle from "./routes/writer/createArticle.route.js";
import writerEditArticle from "./routes/writer/editArticle.route.js";
import categoriesmanagementRouter from "./routes/admin/categories.route.js";
import personsmanagementRouter from "./routes/admin/persons.route.js";
import tagsmanagementRouter from "./routes/admin/tags.route.js";

import editormanagementRouter from "./routes/editor.route.js";
import accountSettingRouter from "./routes/account-setting.route.js";
import postsRouter from "./routes/posts.route.js";
import articleService from "./services/article.service.js";
import categoryService from "./services/category.service.js";
import genPDF from "./public/js/genPDF.js";
const __dirname = dirname(fileURLToPath(import.meta.url));
import fs from "fs";
const app = express();
// const path = require("path");
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.engine(
  "hbs",
  engine({
    extname: "hbs",
    defaultLayout: "main",
    layoutsDir: join(__dirname, "/views/layouts/"),
    partialsDir: join(__dirname, "/views/components/"),
    helpers: {
      format_datetime: formatDateTime,
      isEqual(value1, value2) {
        return value1 === value2;
      },
      splitToArray(str) {
        if (!str) return []; // Nếu chuỗi không tồn tại, trả về mảng rỗng
        return str.split(",").map((item) => item.trim()); // Tách chuỗi và loại bỏ khoảng trắng
      },
      compareStrings(str1, str2) {
        return str1 === str2; // Trả về true nếu hai chuỗi bằng nhau, ngược lại trả về false
      },

  }})
);
app.use(express.json());
app.set("view engine", "hbs");
app.set("views", "./views/pages");
app.use(express.static("public"));
// setup local data for navigation
app.use(async function (req, res, next) {
  const currentCategory = req.query.name || "";
  console.log("Current Category: ", currentCategory);
  const categories = await categoryService.getCategoryName();
  const listCategory = [];
  const parentCat = currentCategory
    ? await categoryService.getParentCategory(currentCategory)
    : "";
  console.log("parent", parentCat);
  for (let index = 0; index < categories.length; index++) {
    listCategory.push({
      currentCategory: currentCategory,
      parent_name: categories[index].parent_name,
      child_categories: categories[index].child_categories,
      parent_cat_active:
        parentCat === categories[index].parent_name ||
        currentCategory === categories[index].parent_name,
    });
  }
  console.log(listCategory);
  res.locals.categories = listCategory;
  next();
});
app.use("/writer/article/manage", writerArticleMangeRouter);
app.use("/writer/article/create", writerCreateArticle);
app.use("/writer/article/edit", writerEditArticle);

app.get("/features", function (req, res) {
  res.render("features");
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.get("/admin", function (req, res) {
  res.render("admin/dashboard", { layout: "admin", title: "Admin Dashboard" });
});

app.get("/login", function (req, res) {
  res.render("login", { layout: "default" });
});

app.get("/signup", function (req, res) {
  res.render("signup", { layout: "default" });
});



app.get("/forgot-password", function (req, res) {
  res.render("forgotPassword", { layout: "default" });
});
app.get("/verify-otp", function (req, res) {
  res.render("verify-otp", { layout: "default" });
});

// function groupArticlesByTags(data) {
//   const groupedData = [];

//   data.forEach((item) => {
//     // Tìm bài viết trong danh sách groupedData
//     const existingArticle = groupedData.find(
//       (article) => article.id === item.id
//     );

//     if (existingArticle) {
//       // Nếu bài viết đã tồn tại, thêm tag vào mảng tags
//       existingArticle.tags.push(item.tag_name);
//     } else {
//       // Nếu chưa tồn tại, thêm bài viết mới với mảng tags
//       groupedData.push({
//         id: item.id,
//         authorId: item.author,
//         title: item.title,
//         abstract: item.abstract,
//         content: item.content,
//         updated_at: item.updated_at,
//         tags: [item.tag_name], // Mảng chứa các tag ban đầu
//         status: item.status,
//         is_premium: item.is_premium,
//       });
//     }
//   });

//   return groupedData;
// }
// app.get('/admin/tags', function (req, res) {
//   res.render('admin/tags', { layout: 'admin', title: 'Tags' });
// });
app.use("/admin/categories", categoriesmanagementRouter);
app.use("/admin/tags", tagsmanagementRouter);
app.use("/admin/persons", personsmanagementRouter);
app.use("/admin/articles", articlesmanagementRouter);
app.use("/posts", postsRouter);
app.use("/AccountSetting", accountSettingRouter);

// app.get("/editor", function (req, res) {
//   res.render("editor", { layout: "admin", title: "Editor" });
// });

app.get("/", async (req, res) => {
  res.render("home", {
    popularPosts: await articleService.getTopTrendingArticles(),
    mostViewed: await articleService.getMostViewedArticles(),
    latestPosts: await articleService.getLatestArticles(),
    topCategories: await articleService.getLatestArticleOfTopCategories(),
  });
});

app.use("/admin/categories", categoriesmanagementRouter);
app.use("/admin/tags", tagsmanagementRouter);
app.use("/admin/persons", personsmanagementRouter);
app.use("/admin/articles", articlesmanagementRouter);
app.use("/editor", editormanagementRouter);
app.post("/generate-pdf", async function (req, res) {
  try {
    const { content, title } = req.body;

    if (!content) {
      return res.status(400).send("Content is required");
    }

    // Tạo PDF
    await genPDF(content, title);

    const filePath = `${title}.pdf`;

    // Gửi file cho client
    res.download(filePath, (err) => {
      if (err) {
        console.error("Error while downloading the file:", err);

        // Nếu xảy ra lỗi khi gửi file, xóa file để tránh lưu trữ không cần thiết
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log("File deleted after download error:", filePath);
        }
        return res.status(500).send("Error downloading PDF");
      }

      // Xóa file sau khi gửi thành công
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("File successfully sent and deleted:", filePath);
      }
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).send("Error generating PDF");
  }
});

app.listen(3000, function () {
  console.log("ecApp is running at http://localhost:3000");
});
