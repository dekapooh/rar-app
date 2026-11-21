"""Publish a read-only snapshot of stored representative Careers, not a rescore."""
import argparse
import csv
from decimal import Decimal, ROUND_HALF_UP
import hashlib
import html
import io
import json
import math
from pathlib import Path

parser=argparse.ArgumentParser()
parser.add_argument('--dataset',type=Path,required=True)
parser.add_argument('--growth-preview',type=Path,required=True)
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
data=json.loads(args.dataset.read_text())
growth=json.loads(args.growth_preview.read_text())
rows=[r for r in data['records'] if r['no'] in (83,84,85)]
assert [r['no'] for r in rows]==[83,84,85]
inputs=json.loads((root.parent/'RAR/data/confirmed/silk_2026_special_verified_inputs_v1.json').read_text())
suit_by_no={r['recruitment_number']:r['suitability'] for r in inputs['records']}
checks=[]
for r in rows:
    for mode in ('middle','high'):
        c=r['career'];events=c['events_'+mode]
        assert len(events)==c[mode+'_starts']
        total=math.fsum(e['gross_prize_yen'] for e in events)
        assert math.isclose(total,c[mode+'_prize_yen'],abs_tol=1e-6)
        checks.append({'no':r['no'],'mode':mode,'count':len(events),'sum_yen':total,'saved_yen':c[mode+'_prize_yen'],'match':True})
assert rows[0]['career']['events_middle']==rows[1]['career']['events_middle']==rows[2]['career']['events_middle']
different=[i+1 for i in range(22) if not rows[0]['career']['events_high'][i]==rows[1]['career']['events_high'][i]==rows[2]['career']['events_high'][i]]
assert different==[3]
snapshot={'schema_version':'rar-stored-special-career-audit-v1','dataset_key':data['dataset_key'],'version_id':data['version_id'],
 'source_api':'https://rar-project-5a27e.web.app/v1/consumer-data/dataset/2026:silk',
 'records':rows,'checks':checks,'suitability_inputs':suit_by_no,
 'comparison':{'middle_identical_records':13,'high_identical_records':21,'high_differing_saved_positions':[3]},
 'growth_reference':growth,'score_write_performed':False,
 'limits':['Only Middle/High representative routes are stored here, not 1000 detailed lifetime histories.',
 'Saved order is not chronological; race dates and venues are absent.',
 'Noninteger performance_position is a prize interpolation input, not a realized finish.',
 'Existing growth v2 reference is not applied to current scores; its 3-horse measurement normalization is degenerate.']}
out=root/'audit/silk-2026-special-career-20261122.json'
out.write_text(json.dumps(snapshot,ensure_ascii=False,indent=2)+'\n')
(root/'audit/silk-2026-special-growth-reference-20261122.json').write_text(json.dumps(growth,ensure_ascii=False,indent=2)+'\n')
def money(value):
    return f'{Decimal(str(value)).quantize(Decimal("1"),rounding=ROUND_HALF_UP):,}'
def position(e):
    if isinstance(e.get('finish_position'),int):return str(e['finish_position'])+'着'
    if e.get('performance_position') is not None:return '整数着順なし／賞金補間 '+f'{e["performance_position"]:.1f}'
    return '未記録'
roles={'PROGRESSION':'進級','TARGET':'指定目標','INFERRED_TARGET':'自動選択目標','FILLER':'一般戦の補充'}
md=['# 追加募集3頭：保存された全Career明細（2026-11-22）','',
 'これは実際の競走成績ではなく、現在の採点に使われたMiddle・Highの代表経路105件です。点数・賞金は書き換えていません。',
 '保存順は開催日順ではありません。開催日・競馬場は保存されていないため補いません。小数の賞金補間値を整数着順に変換しません。','',
 '## 検証結果','',
 '- 3頭のMiddleは13件すべて同一。Highは22件中21件が同一。',
 '- Highの差は保存順3のフェブラリーSのみ。83番6,900万円、84番6,000万円、85番1億1,400万円。',
 '- 現行の1000回処理は到達度分布の診断用サンプリング。公式Dreamは固定されたMiddle/High帯、賞金は代表2経路から算出。1000本の詳細な生涯全レースを積算した記録ではありません。','',
 '|No.|募集馬|Middle合計|High合計|公式賞金（両者平均）|','|---|---|---:|---:|---:|']
for r in rows:
 c=r['career'];md.append(f'|{r["no"]}|{r["name"]}|{money(c["middle_prize_yen"])}円|{money(c["high_prize_yen"])}円|{money(c["official_prize_yen"])}円|')
md+=['','## 適性が同じになる理由','',
 '|No.|父|採点入力の根拠|平均距離・代替値|丸め後の帯|','|---|---|---|---:|---|',
 '|83|ナダル|2025年産駒399出走、ダート比率93.4837%|1624.5m|1400〜1800m|',
 '|84|パレスマリス|2025年産駒33出走、ダート比率81.8182%|1500.0m|1400〜1800m|',
 '|85|Yaupon|7出走で20出走未満。父自身のダート実績＋共通平均へ代替|1599.9m|1400〜1800m|','',
 '200m刻みの四捨五入（100m境界は切り上げ）で中心1600m、中心±200m。血統・馬体を総合した個体別距離予測ではありません。Yauponは少数標本の代替値です。','',
 '## 成長型','',
 '既存v2処理はありますが、今回の3頭の採点はObjective v1のunknownを入力しており未接続です。v2は父の事前値、生年月日、性別、測尺、Potential4部位を使う既存方式。母父は入力していません。係数を変更せず参考計算しました。','',
 '|No.|参考出力|丸め前指数|本採点への適用|','|---|---|---:|---|']
for r in rows:
 g=growth['predictions'][str(r['no'])];md.append(f'|{r["no"]}|{g["growth_display"]}|{g["raw_index"]:.6f}|未適用|')
md+=['','**参考出力の限界：対象が牝2頭・牡1頭のため、この既存方式の測尺補正残差が全頭0になります。この3頭で妥当性確認済みの成長型とは扱わず、本採点に接続していません。**',
 '教師82頭の交差検証は完全一致51.2%、1段階以内91.5%。これは今回の3頭に対する予測精度ではありません。','']
csv_out=io.StringIO();writer=csv.writer(csv_out);writer.writerow(['No','募集馬','経路','保存順','年齢','レース','馬場','距離m','着順又は補間','賞金円','累計円','区分','event_id'])
sections=[]
for r in rows:
    md+=['## No.'+str(r['no'])+' '+r['name'],'']
    for mode in ('middle','high'):
        events=r['career']['events_'+mode];cumulative=0
        md+=['### '+mode.title()+f'：{len(events)}件','',
         '|保存順|年齢|レース|馬場・距離|着順／賞金補間|賞金円|累計円|区分|',
         '|---:|---:|---|---|---|---:|---:|---|']
        tr=[]
        for i,e in enumerate(events,1):
            cumulative+=e['gross_prize_yen'];surface='ダート' if e['surface']=='dirt' else e['surface']
            values=[i,e['age'],e['race_name'],f'{surface}{e["distance_m"]}m',position(e),money(e['gross_prize_yen']),money(cumulative),roles.get(e['route_role'],e['route_role'])]
            md.append('|'+ '|'.join(map(str,values))+'|')
            tr.append('<tr>'+''.join('<td>'+html.escape(str(v))+'</td>' for v in values)+'</tr>')
            writer.writerow([r['no'],r['name'],mode,i,e['age'],e['race_name'],surface,e['distance_m'],position(e),money(e['gross_prize_yen']).replace(',',''),money(cumulative).replace(',',''),e['route_role'],e['event_id']])
        md+=['',f'合計 {money(cumulative)}円。保存されたシナリオ賞金と一致。','']
        sections.append(f'<section id="no{r["no"]}-{mode}"><h2>No.{r["no"]} {html.escape(r["name"])} — {mode.title()} 全{len(events)}件</h2><div class="scroll"><table><thead><tr>'+''.join('<th>'+v+'</th>' for v in ['保存順','年齢','レース','馬場・距離','着順／賞金補間','賞金円','累計円','区分'])+'</tr></thead><tbody>'+''.join(tr)+f'</tbody></table></div><p>合計 <b>{money(cumulative)}円</b> — 保存賞金と一致</p></section>')
md+=['## 根拠コード','',
 '- [現行採点処理](https://github.com/dekapooh/RAR/blob/dd9ccde140472775e0633ddd17a8c91c6cc923fd/builder_app/python/auto_score.py)',
 '- [Dreamの1000回診断と固定帯](https://github.com/dekapooh/RAR/blob/496727e589d571b9232f29316857d4c9b9c50f27/engine/career_sim/dream_scoring.py)',
 '- [代表経路・一般戦補充](https://github.com/dekapooh/RAR/blob/496727e589d571b9232f29316857d4c9b9c50f27/engine/career_sim/roi_route.py)',
 '- [既存成長型v2](https://github.com/dekapooh/RAR/blob/d0693a2c2001b23617c2c678cb5a9f150b86df2e/builder_runtime/suitability_frozen_v2.py)']
(root/'audit/silk-2026-special-career-20261122.md').write_text('\n'.join(md)+'\n')
(root/'audit/silk-2026-special-career-20261122.csv').write_text('\ufeff'+csv_out.getvalue())
nav=''.join(f'<a href="#no{r["no"]}-{mode}">No.{r["no"]} {mode.title()}</a>' for r in rows for mode in ('middle','high'))
intro='<h1>追加募集3頭：全保存明細105件</h1><p>No.83 エイシンシルダリアの25／No.84 ローズファラオの25／No.85 パーフェクトフルートの25</p><p>Middle・Highの代表経路です。開催日順ではありません。整数着順のない補間値や一般戦の補充を、そのまま明示します。全6経路で賞金合計が保存値と一致しました。</p><p><b>Middle全13件が共通。Highは22件中21件が共通で、フェブラリーSの補間賞金だけが異なります。</b></p><p>3頭の距離帯が同じなのは父の前年実績と200m単位の丸めによるものです。Yauponは少数標本の共通平均へ代替しています。個体ごとの精密な距離予測と確認できた意味ではありません。</p><p>成長型v2は今回の採点に未接続。既存式の参考出力は3頭とも持続成長ですが、3頭の測尺補正が全頭0になる制約があり、本採点には適用していません。</p><p><a href="./audit/silk-2026-special-career-20261122.md">根拠・成長型を含む検証全文</a> ／ <a href="./audit/silk-2026-special-career-20261122.csv">全105件CSV</a> ／ <a href="./audit/silk-2026-special-career-20261122.json">保存データJSON</a></p>'
page='<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RAR 追加募集3頭 全Career保存明細</title><style>body{font:16px/1.65 system-ui,sans-serif;color:#193a30;background:#f4f7f5;margin:0;padding:18px}main{max-width:1100px;margin:auto}section{background:white;padding:16px;margin:20px 0;border-radius:12px}h1{font-size:25px}h2{font-size:20px}nav{display:flex;gap:12px;flex-wrap:wrap}a{color:#155d48}.scroll{overflow:auto}table{border-collapse:collapse;min-width:820px;width:100%;font-size:14px}td,th{padding:8px;border-bottom:1px solid #d9e4de;text-align:left}th{background:#e6f0ea;white-space:nowrap}td:nth-child(6),td:nth-child(7){text-align:right;white-space:nowrap}</style><main>'+intro+'<nav>'+nav+'</nav>'+''.join(sections)+'</main></html>'
(root/'career-audit-20261122.html').write_text(page)
print('SAVED_EVENTS=105; SCENARIO_SUMS=6/6_PASS; SCORES_CHANGED=0')
