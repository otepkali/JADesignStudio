"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Inter } from "next/font/google";
import { initBuilder } from "./builderScript";

const inter = Inter({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"] });

const THREE_CDN_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
const THREE_SCRIPT_ID = "three-js-cdn";

function loadThree(): Promise<void> {
  return new Promise((resolve, reject) => {
    const w = window as unknown as { THREE?: unknown };
    if (w.THREE) {
      resolve();
      return;
    }
    const existing = document.getElementById(THREE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("three.js failed to load")));
      return;
    }
    const script = document.createElement("script");
    script.id = THREE_SCRIPT_ID;
    script.src = THREE_CDN_URL;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("three.js failed to load"));
    document.head.appendChild(script);
  });
}

export default function BuilderPage() {
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    loadThree()
      .then(() => {
        if (cancelled) return;
        cleanup = initBuilder();
      })
      .catch(() => {
        // Falls back to the visible .fail message inside initBuilder/initGL.
      });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <div className={`builder-app ${inter.className}`}>
      <div className="stage" id="stage">
        <canvas id="gl" aria-label="3D-модель секции гардеробной из товаров каталога" />
        <div className="tools">
          <button className="tool" type="button" id="tAll" data-act="toggleAll">
            Закрыть ящики
          </button>
          <button className="tool" type="button" id="tClothes" data-act="clothes">
            Скрыть одежду
          </button>
          <button className="tool accent" type="button" data-act="reel">
            Режим для рилса
          </button>
        </div>
        <div className="hint">Тяните — вращать · колесо или щипок — масштаб · нажмите на ящик — открыть</div>
        <div className="fail" id="fail">
          Не удалось запустить 3D. Конструктор по-прежнему считает цену и состав заказа.
        </div>
        <div className="reel-ui">
          <div className="wm">
            <b>JANERKE ABAT</b>
            <span>DESIGN</span>
          </div>
          <div className="url">ja-design-studio.vercel.app/catalog</div>
          <button className="tool reel-exit" type="button" data-act="exitReel">
            Выйти
          </button>
        </div>
      </div>

      <div className="panel" id="panel">
        <div className="logo">
          <b>JANERKE ABAT</b>
          <span>DESIGN</span>
        </div>
        <h1>Соберите гардеробную</h1>
        <p className="lede">
          Выберите штангу, ящики, ручки и стойку для обуви: секция соберётся в 3D из товаров нашего каталога, а цена
          посчитается сама. Готовый набор уходит нам в заявке.
        </p>
        <p className="lede" style={{ marginTop: 6 }}>
          <Link href="/catalog" style={{ color: "var(--wine)" }}>
            ← Назад в каталог
          </Link>
        </p>

        <section className="blk">
          <h2>Ширина секции</h2>
          <div id="r-width" />
        </section>
        <section className="blk">
          <h2>Штанга</h2>
          <div id="r-rod" />
        </section>
        <section className="blk">
          <h2>Ящики и полки</h2>
          <div id="r-meter" />
          <div id="r-stack" />
          <div className="stack-title">Добавить в секцию</div>
          <div id="r-picker" />
        </section>
        <section className="blk">
          <h2>Ручки</h2>
          <div id="r-handle" />
        </section>
        <section className="blk">
          <h2>Стойка для обуви</h2>
          <div id="r-rack" />
        </section>
        <p className="fine">Цены розничные, в тенге. Наличие и сроки подтвердим в Telegram.</p>
      </div>

      <div className="bar" id="bar">
        <div className="tot">
          <small id="b-count" />
          <b id="b-total" />
        </div>
        <button className="buy" type="button" data-act="order">
          Отправить заявку
        </button>
      </div>

      <div className="modal" id="modal" hidden role="dialog" aria-modal="true" aria-labelledby="mt">
        <div className="mc">
          <h2 id="mt">Ваш заказ</h2>
          <p>Укажите имя и телефон — отправим подборку нам в Telegram, мы подтвердим наличие и сроки.</p>
          <textarea id="otext" readOnly />

          <div id="oform" style={{ marginTop: 14 }}>
            <label htmlFor="oname" className="cap" style={{ display: "block", marginBottom: 4 }}>
              Ваше имя
            </label>
            <input id="oname" type="text" className="ofield" />
            <label htmlFor="ophone" className="cap" style={{ display: "block", margin: "10px 0 4px" }}>
              Телефон
            </label>
            <input id="ophone" type="tel" className="ofield" placeholder="+7 ___ ___ __ __" />
            <div id="oerr" style={{ marginTop: 8, fontSize: 13, color: "#c0392b" }} />
          </div>

          <div id="osent" style={{ display: "none", marginTop: 14, color: "var(--wine)", fontSize: 14 }}>
            Спасибо! Заявка отправлена, мы свяжемся с вами в ближайшее время.
          </div>

          <div className="ok" id="ook" aria-live="polite" />
          <div className="acts">
            <button type="button" id="osubmit">
              Отправить заявку
            </button>
            <button type="button" id="ocopy">
              Скопировать текст
            </button>
            <button type="button" id="oclose">
              Закрыть
            </button>
          </div>
        </div>
      </div>

      <div className="lb" id="lb" hidden role="dialog" aria-modal="true" aria-label="Фото товара">
        <button className="lb-x" id="lbx" type="button" aria-label="Закрыть">
          ✕
        </button>
        <button className="lb-n prev" id="lbp" type="button" aria-label="Предыдущий товар">
          ‹
        </button>
        <button className="lb-n next" id="lbn" type="button" aria-label="Следующий товар">
          ›
        </button>
        <div className="lb-card">
          <div className="lb-img" id="lbi">
            <img id="lbimg" alt="" draggable="false" />
            <div className="lb-hint" id="lbh">
              Нажмите на фото, чтобы приблизить
            </div>
          </div>
          <div className="lb-info">
            <div className="tx">
              <b id="lbt" />
              <span id="lbs" />
            </div>
            <div className="lb-pr" id="lbpr" />
            <button className="lb-add" id="lba" type="button" />
          </div>
        </div>
      </div>

      <style jsx global>{`
        :root {
          --bld-bg: #f7f6f4;
          --bld-bg2: #ece5e0;
          --bld-surface: #ffffff;
          --bld-ink: #1b1517;
          --bld-muted: #756a6e;
          --bld-line: #e6dfdc;
          --bld-wine: #5b1a2c;
          --bld-on-wine: #ffffff;
          --bld-soft: #f3eeeb;
          --bld-tag: #fff0cf;
          --bld-tag-ink: #7a5410;
        }
        @media (prefers-color-scheme: dark) {
          :root:not([data-theme="light"]) {
            --bld-bg: #151113;
            --bld-bg2: #0f0b0d;
            --bld-surface: #201a1d;
            --bld-ink: #f4eeee;
            --bld-muted: #b0a4a8;
            --bld-line: #3a2f33;
            --bld-wine: #c0587a;
            --bld-on-wine: #1a0f13;
            --bld-soft: #2a2226;
            --bld-tag: #3a2e14;
            --bld-tag-ink: #f0c46a;
          }
        }
        :root[data-theme="dark"] {
          --bld-bg: #151113;
          --bld-bg2: #0f0b0d;
          --bld-surface: #201a1d;
          --bld-ink: #f4eeee;
          --bld-muted: #b0a4a8;
          --bld-line: #3a2f33;
          --bld-wine: #c0587a;
          --bld-on-wine: #1a0f13;
          --bld-soft: #2a2226;
          --bld-tag: #3a2e14;
          --bld-tag-ink: #f0c46a;
        }
        body.reel {
          overflow: hidden;
        }
      `}</style>

      <style jsx>{`
        .builder-app :global(button) {
          font: inherit;
          color: inherit;
        }
        :global(.wine) {
          color: var(--bld-wine);
        }

        .builder-app {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 440px;
          min-height: 100vh;
          min-height: 100svh;
          background: var(--bld-bg);
          color: var(--bld-ink);
          font-size: 15px;
          line-height: 1.45;
          -webkit-font-smoothing: antialiased;
        }
        .stage {
          position: sticky;
          top: 0;
          height: 100vh;
          height: 100svh;
          background: radial-gradient(ellipse 75% 65% at 50% 45%, var(--bld-bg), var(--bld-bg2));
          overflow: hidden;
        }
        .stage :global(#gl) {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
          touch-action: none;
          cursor: grab;
        }
        .stage :global(#gl:active) {
          cursor: grabbing;
        }
        .tools {
          position: absolute;
          left: 16px;
          top: 16px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          max-width: calc(100% - 32px);
        }
        .tool {
          border: 1px solid var(--bld-line);
          background: var(--bld-surface);
          color: var(--bld-ink);
          padding: 9px 14px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
        }
        .tool:hover {
          border-color: var(--bld-wine);
        }
        .tool.accent {
          background: var(--bld-wine);
          color: var(--bld-on-wine);
          border-color: var(--bld-wine);
        }
        .hint {
          position: absolute;
          left: 18px;
          bottom: 16px;
          font-size: 12px;
          color: var(--bld-muted);
          pointer-events: none;
        }
        .fail {
          position: absolute;
          inset: 0;
          display: none;
          align-items: center;
          justify-content: center;
          padding: 24px;
          text-align: center;
          color: var(--bld-muted);
        }

        .reel-ui {
          display: none;
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        :global(body.reel) .reel-ui {
          display: block;
        }
        :global(body.reel) .tools,
        :global(body.reel) .hint {
          display: none;
        }
        :global(body.reel) .stage {
          position: fixed;
          inset: 0;
          height: 100vh;
          height: 100svh;
          z-index: 50;
        }
        :global(body.reel) .panel,
        :global(body.reel) .bar {
          display: none;
        }
        .wm {
          position: absolute;
          top: calc(22px + env(safe-area-inset-top, 0px));
          left: 0;
          right: 0;
          text-align: center;
          color: var(--bld-wine);
        }
        .wm b {
          display: block;
          font: 400 clamp(22px, 4.2vw, 34px) / 1 "Playfair Display", Georgia, serif;
          letter-spacing: 0.07em;
        }
        .wm span {
          display: flex;
          align-items: center;
          gap: 10px;
          justify-content: center;
          margin: 8px auto 0;
          width: min(240px, 50%);
          font-size: 10px;
          letter-spacing: 0.3em;
          font-weight: 500;
        }
        .wm span:before,
        .wm span:after {
          content: "";
          flex: 1;
          height: 1px;
          background: currentColor;
          opacity: 0.6;
        }
        .url {
          position: absolute;
          bottom: calc(26px + env(safe-area-inset-bottom, 0px));
          left: 0;
          right: 0;
          text-align: center;
          font-size: clamp(14px, 2.6vw, 18px);
          font-weight: 500;
          color: var(--bld-ink);
        }
        .reel-exit {
          position: absolute;
          top: calc(14px + env(safe-area-inset-top, 0px));
          right: 14px;
          pointer-events: auto;
          opacity: 0.75;
        }

        .panel {
          padding: 26px 26px 140px;
          min-width: 0;
        }
        .logo {
          color: var(--bld-wine);
          margin-bottom: 22px;
        }
        .logo b {
          display: block;
          font: 400 22px / 1 "Playfair Display", Georgia, serif;
          letter-spacing: 0.07em;
        }
        .logo span {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 7px;
          width: 170px;
          font-size: 9px;
          letter-spacing: 0.3em;
          font-weight: 500;
        }
        .logo span:before,
        .logo span:after {
          content: "";
          flex: 1;
          height: 1px;
          background: currentColor;
          opacity: 0.6;
        }
        .panel :global(h1),
        .panel :global(h2) {
          font-family: "Playfair Display", Georgia, serif;
          font-weight: 500;
          margin: 0;
        }
        .panel :global(h1) {
          font-size: clamp(28px, 3.4vw, 34px);
          line-height: 1.15;
        }
        .lede {
          margin: 10px 0 0;
          color: var(--bld-muted);
        }
        .blk {
          margin-top: 28px;
        }
        .blk :global(h2) {
          font-size: 19px;
          line-height: 1.25;
          margin-bottom: 12px;
        }
        .builder-app :global(.seg) {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .builder-app :global(.chip) {
          border: 1px solid var(--bld-line);
          background: var(--bld-surface);
          padding: 9px 14px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 14px;
        }
        .builder-app :global(.chip[aria-pressed="true"]) {
          background: var(--bld-wine);
          color: var(--bld-on-wine);
          border-color: var(--bld-wine);
        }
        .builder-app :global(.chip:disabled) {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .builder-app :global(.chip.pic) {
          display: inline-flex;
          align-items: center;
          padding: 4px;
          cursor: default;
        }
        .builder-app :global(.chip.pic .cb) {
          border: 0;
          background: none;
          color: inherit;
          font: inherit;
          cursor: pointer;
          padding: 0 10px 0 8px;
          height: 38px;
          display: inline-flex;
          align-items: center;
          border-radius: 8px;
        }
        .builder-app :global(.chip.pic.on) {
          background: var(--bld-wine);
          color: var(--bld-on-wine);
          border-color: var(--bld-wine);
        }
        .builder-app :global(.chip.pic img) {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          object-fit: contain;
          background: #fff;
          flex: none;
          display: block;
        }
        .builder-app :global(.zb) {
          border: 0;
          background: none;
          padding: 0;
          margin: 0;
          cursor: zoom-in;
          flex: none;
          display: block;
          border-radius: 10px;
          position: relative;
        }
        .builder-app :global(.zb:hover img) {
          outline: 2px solid var(--bld-wine);
          outline-offset: -1px;
        }
        .builder-app :global(.zb:after) {
          content: "";
          position: absolute;
          right: 3px;
          bottom: 3px;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          background: rgba(27, 21, 23, 0.62)
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cg fill='none' stroke='white' stroke-width='1.6' stroke-linecap='round'%3E%3Ccircle cx='7' cy='7' r='3.6'/%3E%3Cpath d='M10 10l3 3'/%3E%3C/g%3E%3C/svg%3E")
            center/11px no-repeat;
          pointer-events: none;
        }
        .builder-app :global(.chip.pic .zb:after) {
          width: 13px;
          height: 13px;
          right: 1px;
          bottom: 1px;
          background-size: 9px;
        }

        .builder-app :global(.lb) {
          position: fixed;
          inset: 0;
          z-index: 120;
          background: rgba(10, 6, 8, 0.74);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .builder-app :global(.lb[hidden]) {
          display: none;
        }
        .builder-app :global(.lb-card) {
          background: var(--bld-surface);
          border: 1px solid var(--bld-line);
          border-radius: 22px;
          width: 100%;
          max-width: 760px;
          overflow: hidden;
        }
        .builder-app :global(.lb-img) {
          position: relative;
          height: min(60vh, 560px);
          background: #fff;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: zoom-in;
        }
        .builder-app :global(.lb-img.z) {
          cursor: zoom-out;
        }
        .builder-app :global(.lb-img img) {
          max-width: 100%;
          max-height: 100%;
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          transition: transform 0.22s ease;
          user-select: none;
          -webkit-user-drag: none;
        }
        .builder-app :global(.lb-img.z img) {
          transform: scale(2.4);
        }
        .builder-app :global(.lb-hint) {
          position: absolute;
          left: 12px;
          bottom: 10px;
          font-size: 12px;
          color: #7a6f73;
          background: rgba(255, 255, 255, 0.85);
          border-radius: 99px;
          padding: 3px 10px;
          pointer-events: none;
        }
        .builder-app :global(.lb-info) {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          padding: 16px 18px;
        }
        .builder-app :global(.lb-info .tx) {
          flex: 1;
          min-width: 200px;
        }
        .builder-app :global(.lb-info b) {
          display: block;
          font-size: 16px;
          font-weight: 600;
          line-height: 1.3;
        }
        .builder-app :global(.lb-info span) {
          display: block;
          color: var(--bld-muted);
          font-size: 13px;
        }
        .builder-app :global(.lb-pr) {
          font-weight: 600;
          font-size: 18px;
          white-space: nowrap;
        }
        .builder-app :global(.lb-add) {
          border: 0;
          background: var(--bld-wine);
          color: var(--bld-on-wine);
          border-radius: 12px;
          height: 44px;
          padding: 0 18px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          white-space: nowrap;
        }
        .builder-app :global(.lb-add:disabled) {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .builder-app :global(.lb-x),
        .builder-app :global(.lb-n) {
          position: fixed;
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: rgba(20, 12, 15, 0.6);
          color: #fff;
          border-radius: 50%;
          width: 44px;
          height: 44px;
          cursor: pointer;
          font-size: 20px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .builder-app :global(.lb-x) {
          top: calc(14px + env(safe-area-inset-top, 0px));
          right: 14px;
        }
        .builder-app :global(.lb-n) {
          top: 50%;
          transform: translateY(-50%);
        }
        .builder-app :global(.lb-n.prev) {
          left: 12px;
        }
        .builder-app :global(.lb-n.next) {
          right: 12px;
        }
        .builder-app :global(.lb-x:hover),
        .builder-app :global(.lb-n:hover) {
          background: rgba(91, 26, 44, 0.9);
        }
        @media (max-width: 900px) {
          .builder-app :global(.lb-n) {
            top: auto;
            bottom: calc(18px + env(safe-area-inset-bottom, 0px));
            transform: none;
          }
          .builder-app :global(.lb-n.prev) {
            left: calc(50% - 56px);
          }
          .builder-app :global(.lb-n.next) {
            right: calc(50% - 56px);
          }
          .builder-app :global(.lb-info) {
            padding-bottom: 70px;
          }
        }

        .builder-app :global(.cap) {
          font-size: 13px;
          color: var(--bld-muted);
          margin-top: 8px;
        }
        .builder-app :global(.meter) {
          height: 6px;
          border-radius: 99px;
          background: var(--bld-line);
          overflow: hidden;
          margin: 0 0 14px;
        }
        .builder-app :global(.meter i) {
          display: block;
          height: 100%;
          background: var(--bld-wine);
          border-radius: 99px;
          transition: width 0.4s ease;
        }
        .builder-app :global(ul.list) {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 8px;
        }
        .builder-app :global(.row) {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--bld-surface);
          border: 1px solid var(--bld-line);
          border-radius: 14px;
          padding: 8px 12px 8px 8px;
        }
        .builder-app :global(.th) {
          width: 58px;
          height: 58px;
          border-radius: 10px;
          object-fit: contain;
          background: #fff;
          flex: none;
          display: block;
          border: 1px solid var(--bld-line);
        }
        .builder-app :global(.rt) {
          flex: 1;
          min-width: 0;
        }
        .builder-app :global(.rt b) {
          display: block;
          font-weight: 500;
          font-size: 14px;
          line-height: 1.3;
        }
        .builder-app :global(.rt span) {
          display: block;
          color: var(--bld-muted);
          font-size: 12px;
        }
        .builder-app :global(.pr) {
          font-weight: 600;
          font-size: 14px;
          white-space: nowrap;
        }
        .builder-app :global(.mini) {
          border: 1px solid var(--bld-line);
          background: var(--bld-surface);
          border-radius: 10px;
          min-width: 36px;
          height: 36px;
          padding: 0 10px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
        }
        .builder-app :global(.mini:hover:not(:disabled)) {
          border-color: var(--bld-wine);
        }
        .builder-app :global(.mini:disabled) {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .builder-app :global(.mini.add) {
          color: var(--bld-wine);
          border-color: var(--bld-wine);
        }
        .builder-app :global(.ctl) {
          display: flex;
          gap: 6px;
        }
        .builder-app :global(.empty) {
          color: var(--bld-muted);
          font-size: 14px;
          padding: 12px;
          border: 1px dashed var(--bld-line);
          border-radius: 14px;
        }
        .builder-app :global(.stack-title) {
          margin: 18px 0 8px;
          font-size: 14px;
          font-weight: 600;
        }
        .builder-app :global(.tag) {
          display: inline-block;
          background: var(--bld-tag);
          color: var(--bld-tag-ink);
          font-size: 11px;
          font-weight: 500;
          border-radius: 99px;
          padding: 1px 8px;
          margin-left: 6px;
          vertical-align: 1px;
        }
        .fine {
          margin-top: 22px;
          font-size: 12.5px;
          color: var(--bld-muted);
        }

        .bar {
          position: fixed;
          right: 0;
          bottom: 0;
          width: 440px;
          z-index: 20;
          background: var(--bld-surface);
          border-top: 1px solid var(--bld-line);
          padding: 14px 26px calc(14px + env(safe-area-inset-bottom, 0px));
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .bar :global(.tot) {
          flex: 1;
          min-width: 0;
        }
        .bar :global(.tot small) {
          display: block;
          color: var(--bld-muted);
          font-size: 12px;
        }
        .bar :global(.tot b) {
          font-size: 22px;
          font-weight: 600;
          letter-spacing: -0.01em;
        }
        .buy {
          border: 0;
          background: var(--bld-wine);
          color: var(--bld-on-wine);
          border-radius: 14px;
          padding: 0 20px;
          height: 50px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          white-space: nowrap;
        }
        .buy:hover {
          filter: brightness(1.08);
        }

        .builder-app :global(.modal) {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(10, 6, 8, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .builder-app :global(.modal[hidden]) {
          display: none;
        }
        .builder-app :global(.mc) {
          background: var(--bld-surface);
          border: 1px solid var(--bld-line);
          border-radius: 22px;
          max-width: 520px;
          width: 100%;
          max-height: 92vh;
          overflow: auto;
          padding: 24px;
        }
        .builder-app :global(.mc h2) {
          font-size: 22px;
          margin-bottom: 6px;
        }
        .builder-app :global(.mc p) {
          margin: 0 0 12px;
          color: var(--bld-muted);
          font-size: 14px;
        }
        .builder-app :global(.mc textarea) {
          width: 100%;
          height: 140px;
          border: 1px solid var(--bld-line);
          border-radius: 12px;
          background: var(--bld-soft);
          color: var(--bld-ink);
          padding: 12px;
          font: 13px/1.5 Inter, system-ui, sans-serif;
          resize: vertical;
        }
        .builder-app :global(.ofield) {
          width: 100%;
          height: 44px;
          border: 1px solid var(--bld-line);
          border-radius: 12px;
          background: var(--bld-surface);
          color: var(--bld-ink);
          padding: 0 12px;
          font: 14px/1.4 Inter, system-ui, sans-serif;
        }
        .builder-app :global(.ofield:focus) {
          outline: 2px solid var(--bld-wine);
          outline-offset: 1px;
        }
        .builder-app :global(.mc .acts) {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 14px;
        }
        .builder-app :global(.mc .acts button) {
          flex: 1;
          min-width: 150px;
          height: 46px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          border: 1px solid var(--bld-line);
          background: var(--bld-surface);
          color: var(--bld-ink);
        }
        .builder-app :global(.mc .acts #osubmit) {
          background: var(--bld-wine);
          color: var(--bld-on-wine);
          border-color: var(--bld-wine);
        }
        .builder-app :global(.mc .ok) {
          min-height: 20px;
          margin-top: 8px;
          font-size: 13px;
          color: var(--bld-wine);
        }

        @media (max-width: 900px) {
          .builder-app {
            display: block;
          }
          .stage {
            height: 48vh;
            height: 48svh;
            z-index: 5;
          }
          .tools {
            left: 10px;
            top: 10px;
            gap: 6px;
          }
          .tool {
            padding: 7px 11px;
            font-size: 12px;
          }
          .hint {
            display: none;
          }
          .panel {
            padding: 20px 16px 150px;
          }
          .bar {
            left: 0;
            width: 100%;
            padding-left: 16px;
            padding-right: 16px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .builder-app :global(.meter i) {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
