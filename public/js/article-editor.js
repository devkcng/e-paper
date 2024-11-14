const ulTags = document.querySelector('.article-editor-tagInput ul'),
  tagInput = document.querySelector('.article-editor-tagInput input');
tagNumb = document.querySelector('.article-editor-tagsDetail span');

let maxTags = 5;
let tags = [];
function countTags() {
  tagInput.focus();
  tagNumb.innerText = maxTags - tags.length;
}
function createTag() {
  ulTags.querySelectorAll('li').forEach((li) => li.remove());
  tags
    .slice()
    .reverse()
    .forEach((tag) => {
      let liTag = `<li>${tag} <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16" onclick="remove(this, '${tag}')">
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
            </svg> </li>`;
      ulTags.insertAdjacentHTML('afterbegin', liTag);
    });
  countTags();
}
function remove(element, tag) {
  let index = tags.indexOf(tag);
  tags = [...tags.slice(0, index), ...tags.slice(index + 1)];
  element.parentElement.remove();
  countTags();
}
function addTag(e) {
  if (e.key == 'Enter') {
    let tag = e.target.value.replace(/\s+/g, ' ');
    if (tag.length > 1 && !tags.includes(tag)) {
      if (tags.length < 10) {
        tag.split(',').forEach((tag) => {
          tags.push(tag);
          createTag();
        });
      }
    }
    e.target.value = '';
  }
}
tagInput.addEventListener('keyup', addTag);
