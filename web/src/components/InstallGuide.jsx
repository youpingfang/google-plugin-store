// InstallGuide — collapsible section that explains how to install a
// downloaded extension zip. Modeled on the "how to install" panels
// you'd see on self-hosted store pages. Default browsers: Chrome,
// Edge, Firefox, and a "Other Chromium-based" bucket (Brave, Arc,
// Opera, Vivaldi, etc.). Safari requires a separate Xcode flow that
// we don't support here.

import { useState } from 'react';
import { ChevronDown, ChevronUp, Chrome, Globe, Zap, FolderOpen, Settings, Power, MousePointerClick, FileQuestion } from 'lucide-react';

const GUIDES = [
  {
    id: 'chrome',
    name: 'Chrome',
    icon: Chrome,
    accent: 'from-blue-500 to-emerald-500',
    steps: [
      { icon: FolderOpen, text: <>下载 zip 后**先解压**到一个固定文件夹（例如 <code className="px-1 py-0.5 bg-surface rounded text-xs">~/Extensions/my-plugin</code>），**不要直接双击** zip。</> },
      { icon: Globe, text: <>地址栏输入 <code className="px-1 py-0.5 bg-surface rounded text-xs">chrome://extensions</code> 回车，进入扩展管理页。</> },
      { icon: Power, text: <>打开右上角的 **"开发者模式"** 开关。</> },
      { icon: MousePointerClick, text: <>点左上角 **"加载已解压的扩展程序"** 按钮，选刚才解压的文件夹。</> },
      { icon: Settings, text: <>确认扩展出现在列表里、状态为「已启用」。图标会出现在浏览器工具栏。</> },
    ],
    note: '每次浏览器升级或重启后，未打包的扩展会失效，需要重新加载。打包成 .crx 可以缓解，但无法上架 Chrome Web Store。',
  },
  {
    id: 'edge',
    name: 'Edge',
    icon: Chrome, // lucide doesn't ship a separate Edge icon; reuse Chrome
    accent: 'from-cyan-500 to-blue-500',
    steps: [
      { icon: FolderOpen, text: '下载 zip 后**先解压**到一个固定文件夹。' },
      { icon: Globe, text: <>地址栏输入 <code className="px-1 py-0.5 bg-surface rounded text-xs">edge://extensions</code> 回车。</> },
      { icon: Power, text: '打开左下角 **"开发人员模式"** 开关。' },
      { icon: MousePointerClick, text: '点 **"加载解压缩的扩展"**，选择解压后的文件夹。' },
    ],
    note: 'Edge 与 Chrome 共享 Chromium 内核，扩展通用。',
  },
  {
    id: 'firefox',
    name: 'Firefox',
    icon: Globe,
    accent: 'from-orange-500 to-amber-500',
    steps: [
      { icon: FolderOpen, text: '下载 zip 后**保持压缩**——Firefox 临时加载只需要 zip 文件。' },
      { icon: Globe, text: <>地址栏输入 <code className="px-1 py-0.5 bg-surface rounded text-xs">about:debugging#/runtime/this-firefox</code> 回车。</> },
      { icon: MousePointerClick, text: '点 **"临时载入附加组件"**，选择下载的 zip 文件。' },
      { icon: Settings, text: '扩展会一直运行，直到 Firefox 重启（Firefox 不允许永久加载未签名扩展）。' },
    ],
    note: '想要永久使用，需要用 Mozilla 的 AMO 签名流程，或者把扩展打包成 .xpi。',
  },
  {
    id: 'other',
    name: '其他 Chromium 浏览器',
    icon: Zap,
    accent: 'from-purple-500 to-pink-500',
    steps: [
      { icon: Globe, text: 'Brave / Arc / Opera / Vivaldi 等都基于 Chromium，步骤与 Chrome 完全一致。' },
      { icon: Settings, text: '唯一区别是扩展页面的地址：Brave 用 `brave://extensions`，Vivaldi 用 `vivaldi://extensions`，等等。' },
    ],
    note: '如果你用的是 Safari 或移动浏览器，抱歉这个 store 不支持——Safari 扩展需要 Xcode 重新打包。',
  },
];

function InstallGuide() {
  const [openId, setOpenId] = useState('chrome');
  const [open, setOpen] = useState(true);

  return (
    <section className="mt-8 bg-surface border border-border rounded-2xl overflow-hidden">
      {/* Section header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4
                 hover:bg-surface-2 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-hover
                        flex items-center justify-center shadow-sm">
            <FileQuestion className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="text-left">
            <h2 className="text-base font-bold text-text-primary">下载后如何安装？</h2>
            <p className="text-xs text-text-secondary">
              本店提供的是未签名的 zip，跟 Chrome Web Store 的「一键安装」不一样，需要手动加载。
            </p>
          </div>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-text-secondary" /> : <ChevronDown className="w-5 h-5 text-text-secondary" />}
      </button>

      {open && (
        <div className="border-t border-border">
          {/* Browser tabs */}
          <div className="flex items-center gap-1 px-3 pt-3 overflow-x-auto scrollbar-hide">
            {GUIDES.map((g) => {
              const Icon = g.icon;
              const active = g.id === openId;
              return (
                <button
                  key={g.id}
                  onClick={() => setOpenId(g.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                            whitespace-nowrap transition-all
                            ${active
                              ? 'bg-background text-text-primary shadow-sm'
                              : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
                            }`}
                >
                  <Icon className="w-4 h-4" />
                  {g.name}
                </button>
              );
            })}
          </div>

          {/* Active guide content */}
          {GUIDES.filter((g) => g.id === openId).map((g) => (
            <div key={g.id} className="px-5 py-4">
              <ol className="space-y-3">
                {g.steps.map((step, i) => {
                  const StepIcon = step.icon;
                  return (
                    <li key={i} className="flex items-start gap-3">
                      <div className={`shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br ${g.accent}
                                    flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 pt-0.5 text-sm text-text-primary leading-relaxed">
                        {step.text}
                      </div>
                      <StepIcon className="shrink-0 w-4 h-4 text-text-secondary mt-1" />
                    </li>
                  );
                })}
              </ol>
              <p className="mt-4 text-xs text-text-secondary bg-background/50 rounded-lg p-3 leading-relaxed">
                💡 {g.note}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default InstallGuide;
