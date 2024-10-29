<template>
  <form @submit="handleSubmit">
  <div class="text-editor">
    <div class="toolbar" v-if="editor">
      <div class="align-dropdown">
        <button class="dropbtn">
          Heading ▼
        </button>
        <div class="dropdown-content">
          <a 
          v-for="index in 6"
          :class="{ 'active': editor.isActive('heading', { level: index }) }"
          :style="{ fontSize: (20 - index) + 'px' }"
          @click="onHeadingClick(index)"
          role="button"
          :key="index"
          >
            H{{ index }}
          </a>
        </div>
      </div>

      <button 
        v-for="{ slug, option, active, icon }, index in textActions"
        :class="{ 'active': editor.isActive(active) }"
        @click="onActionClick(slug, option)"
        :key="index">
        <i :class="icon"></i>
      </button>
      <!-- <button @click="handleImageUpload" :class="{ 'active': editor.isActive('image') }">
        <i class="ri-image-line"></i>
      </button> -->
    </div>

    <editor-content :editor="editor" />

    <div v-if="editor" class="footer">
      <span class="characters-count" :class="maxLimit ? limitWarning : ''">
        {{ charactersCount }} {{ maxLimit ? `/ ${maxLimit} characters` : 'characters' }}
      </span>
      |
      <span class="words-count">
        {{ wordsCount }} words
      </span>
    </div>
  </div>
</form>
</template>

<script setup>
import { defineProps, watch, ref, computed, defineEmits, onBeforeUnmount} from "vue";
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import CharacterCount from '@tiptap/extension-character-count';
import Heading from '@tiptap/extension-heading';
import Image from '@tiptap/extension-image';
const props = defineProps({
  modelValue  : {
    type : String,
    default: '',
    required : true
  },
  maxLimit    : {
    type : Number,
    default: 1000,
    required: false
  }
})

const emits = defineEmits(["update:modelValue"]);

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Underline,
    Subscript,
    Superscript,
    CharacterCount.configure({
      limit: props.maxLimit,
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Heading,
    Image.configure({
      inline: true,
      upload: file => {
        const imageUrl = generateImageUrl(file); 
        return Promise.resolve(imageUrl);
      },
    }),
  ],
  onUpdate: () => {
    emits('update:modelValue', editor.value.getHTML());
  },
});

const textActions = ref([
  { slug: 'bold', icon: 'ri-bold', active: 'bold' },
  { slug: 'italic', icon: 'ri-italic', active: 'italic' },
  { slug: 'underline', icon: 'ri-underline', active: 'underline' },
  { slug: 'strike', icon: 'ri-strikethrough', active: 'strike' },
  { slug: 'align', option: 'left', icon: 'ri-align-left', active: { textAlign: 'left' } },
  { slug: 'align', option: 'center', icon: 'ri-align-center', active: { textAlign: 'center' } },
  { slug: 'align', option: 'right', icon: 'ri-align-right', active: { textAlign: 'right' } },
  { slug: 'align', option: 'justify', icon: 'ri-align-justify', active: { textAlign: 'justify' } },
  { slug: 'bulletList', icon: 'ri-list-unordered', active: 'bulletList' },
  { slug: 'orderedList', icon: 'ri-list-ordered', active: 'orderedList' },
  { slug: 'subscript', icon: 'ri-subscript-2', active: 'subscript' },
  { slug: 'superscript', icon: 'ri-superscript-2', active: 'superscript' },
  { slug: 'undo', icon: 'ri-arrow-go-back-line', active: 'undo' },
  { slug: 'redo', icon: 'ri-arrow-go-forward-line', active: 'redo' },
  { slug: 'clear', icon: 'ri-format-clear', active: 'clear' },
])

const charactersCount = computed (() => {
  return editor.value.storage.characterCount.characters();
})

const wordsCount = computed (() => {
  return editor.value.storage.characterCount.words();
})

const limitWarning = computed(() => {
  const isCloseToMax = charactersCount >= props.maxLimit - 20;
  const isMax = charactersCount === props.maxLimit;

  if (isCloseToMax && !isMax) return 'warning';
  if (isMax) return 'danger';

  return '';
})

watch(() => props.modelValue, (value) => {
  if (editor.value.getHTML() === value) return;
  
  editor.value.commands.setContent(props.modelValue, false);
})

const onActionClick = (slug, option = null) => {
  const vm = editor.value.chain().focus();
  const actionTriggers = {
    bold: () => vm.toggleBold().run(),
    italic: () => vm.toggleItalic().run(),
    underline: () => vm.toggleUnderline().run(),
    strike: () => vm.toggleStrike().run(),
    bulletList: () => vm.toggleBulletList().run(),
    orderedList: () => vm.toggleOrderedList().run(),
    align: () => vm.setTextAlign(option).run(),
    subscript: () => vm.toggleSubscript().run(),
    superscript: () => vm.toggleSuperscript().run(),
    undo: () => vm.undo().run(),
    redo: () => vm.redo().run(),
    clear: () => { 
      vm.clearNodes().run();
      vm.unsetAllMarks().run();
    },
    image: () => handleImageUpload()
  };
  actionTriggers[slug]();
}
const handleSubmit = (event) => {
  event.preventDefault(); // 폼 제출 기본 동작 방지
}

const onHeadingClick = (index) => {
  const vm = editor.value.chain().focus();
  vm.toggleHeading({ level: index }).run();
}

onBeforeUnmount(() => {
  editor.value.destroy();
})


const fileList = ref([]);
const handleImageUpload = () => {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    
    const imageUrl = URL.createObjectURL(file); // 파일 업로드 함수 호출
    file.imageUrl = findImageNameUUID(imageUrl);
    fileList.value.push(file);
    insertImage(imageUrl); // 이미지 삽입 함수 호출
  });
  fileInput.click();
};



const insertImage = (imageUrl) => { 
  editor.value.chain().focus().setImage({ src: imageUrl }).run();
};

const findImageNameUUID = (htmlString) =>{ 
  const match = htmlString.split('/');
  if (match) {
    const data = match[match.length-1];
    return data;
  }
}

</script>

<style lang="scss">
@import "https://cdn.jsdelivr.net/npm/remixicon@2.2.0/fonts/remixicon.css";


.text-editor {
  border: 1px solid #808080;

  .toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    border-bottom: 1px solid #808080;

    > button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      font-size: 20px;
      background: #fff;
      color: #333;
      border: none;
      border-radius: 2px;
      margin: 0.5em 4px;
      -webkit-appearance: none;
      cursor: pointer;

      &.active {
        background: #333;
        color: #fff;
      }
    }
  }

  .align-dropdown {
    position: relative;
    display: inline-block;
    margin: 0.5em 8px;

    > button {
      height: 32px;
      background: #fff;
      color: #333;
      border: none;
      border-radius: 2px;
      -webkit-appearance: none;
      cursor: pointer;
    }

    > .dropdown-content {
      display: none;
      position: absolute;
      left: 0;
      right: 0;
      border: 1px solid #333;
      outline: 1px solid #fff;
      border-radius: 2px;
      background-color: #fff;
      z-index: 1;

      a {
        display: block;
        padding: 6px 12px;
        text-align: center;
        cursor: pointer;

        &:hover, &.active {
          background: #333;
          color: #fff;
        }
      }
    }
    
    &:hover .dropdown-content {
      display: block;
    }
  }

  .divider {
    width: 1px;
    height: 24px;
    background: #333;
    margin-right: 6px;
  }

  .footer {
    color: #808080;
    font-size: 14px;
    text-align: right;
    padding: 6px;

    .characters-count {
      &.warning {
        color: orange;
      }

      &.danger {
        color: red;
      }
    }
  }

  .ProseMirror {
    height: 300px;
    overflow-y: auto;
    padding-left: 0.5em;
    padding-right: 0.5em;
    outline: none;

    > p:first-child {
      margin-top: 0.5em;
    }

    > h1, h2, h3, h4, h5, h6 {
      &:first-child {
        margin-top: 0.5em;
      }
    }

    > img {
    display: block;
    margin: 0 auto; // 이미지 중앙 정렬
  }

  }
  h1 {
    font-size: 20px;
  }
  h2 {
    font-size: 19px;
  }
  h3 {
    font-size: 18px;
  }
  h4 {
    font-size: 17px;
  }
  h5 {
    font-size: 16px;
  }
  h6 {
    font-size: 15px;
  }
}
</style>