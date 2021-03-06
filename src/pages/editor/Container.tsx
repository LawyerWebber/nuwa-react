import React, { useState, useEffect, useMemo, useCallback, useContext, useRef } from 'react';
import { Result, Tabs, Button } from 'antd';
import {
  PieChartOutlined,
  PlayCircleOutlined,
  HighlightOutlined,
  DoubleRightOutlined,
  DoubleLeftOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import { connect } from 'dva';
import HeaderComponent from './components/Header';
import CanvasControl from './components/CanvasControl';
import SourceBox from './SourceBox';
import TargetBox from './TargetBox';
import Calibration from 'components/Calibration';
import DynamicEngine, { componentsType } from 'components/DynamicEngine';
import FormEditor from 'components/PanelComponents/FormEditor';

import template1 from 'components/BasicShop/BasicComponents/template';
import mediaTpl1 from 'components/BasicShop/MediaComponents/template';
import graphTpl1 from 'components/BasicShop/VisualComponents/template';

import schemaH5 from 'components/BasicShop/schema';

import { ActionCreators, StateWithHistory } from 'redux-undo';

import { dooringContext } from '@/layouts';
import { throttle } from '@/utils/tool';

import styles from './index.less';

const { TabPane } = Tabs;

const Container = (props: {
  history?: any;
  location?: any;
  pstate?: any;
  cstate?: any;
  dispatch?: any;
}) => {

  // console.log(props);
  const [scaleNum, setScale] = useState(1);
  const [collapsed, setCollapsed] = useState(false);
  const [rightColla, setRightColla] = useState(true);

  const { pstate, cstate, dispatch } = props;
  const pointData = pstate ? pstate.pointData : [];
  const cpointData = cstate ? cstate.pointData : [];

  const changeCollapse = useMemo(() => {
    return (c: boolean) => {
      setCollapsed(c);
    };
  }, []);
  const changeRightColla = useMemo(() => {
    return (c: boolean) => {
      setRightColla(c);
    };
  }, []);
  const context = useContext(dooringContext);
  const curPoint = pstate ? pstate.curPoint : {};

  const template = useMemo(() => {
    if (context.theme === 'h5') {
      return template1;
    } else {
      return template2;
    }
  }, [context.theme]);

  const mediaTpl = useMemo(() => {
    if (context.theme === 'h5') {
      return mediaTpl1;
    } else {
      return mediaTpl2;
    }
  }, [context.theme]);

  const graphTpl = useMemo(() => {
    if (context.theme === 'h5') {
      return graphTpl1;
    } else {
      return graphTpl2;
    }
  }, [context.theme]);

  // 指定画布的id
  let canvasId = 'js_canvas';

  const backSize = () => {
    setScale(1);
    setDragState({ x: 0, y: 0 });
  };

  const CpIcon = {
    base: <HighlightOutlined />,
    media: <PlayCircleOutlined />,
    visible: <PieChartOutlined />,
  };

  const generateHeader = useMemo(() => {
    return (type: componentsType, text: string) => {
      return (
        <div>
          {text}
          {/* {CpIcon[type]} {text} */}
        </div>
      );
    };
  }, [CpIcon]);

  const handleSlider = useMemo(() => {
    return (type: any) => {
      if (type) {
        setScale((prev: number) => +(prev + 0.1).toFixed(1));
      } else {
        setScale((prev: number) => +(prev - 0.1).toFixed(1));
      }
    };
  }, []);

  const handleFormSave = useMemo(() => {
    if (context.theme === 'h5') {
      return (data: any) => {
        dispatch({
          type: 'editorModal/modPointData',
          payload: { ...curPoint, item: { ...curPoint.item, config: data } },
        });
      };
    } else {
      return (data: any) => {
        dispatch({
          type: 'editorPcModal/modPointData',
          payload: { ...curPoint, item: { ...curPoint.item, config: data } },
        });
      };
    }
  }, [context.theme, curPoint, dispatch]);

  const clearData = useCallback(() => {
    if (context.theme === 'h5') {
      dispatch({ type: 'editorModal/clearAll' });
    } else {
      dispatch({ type: 'editorPcModal/clearAll' });
    }
  }, [context.theme, dispatch]);

  const handleDel = useMemo(() => {
    if (context.theme === 'h5') {
      return (id: any) => {
        dispatch({
          type: 'editorModal/delPointData',
          payload: { id },
        });
      };
    } else {
      return (id: any) => {
        dispatch({
          type: 'editorPcModal/delPointData',
          payload: { id },
        });
      };
    }
  }, [context.theme, dispatch]);

  const redohandler = useMemo(() => {
    return () => {
      dispatch(ActionCreators.redo());
    };
  }, [dispatch]);

  const undohandler = useMemo(() => {
    return () => {
      dispatch(ActionCreators.undo());
    };
  }, [dispatch]);

  const importTpl = data => {
    dispatch({
      type: 'editorModal/importTplData',
      payload: data,
    });
  };

  useEffect(() => {
    if (window.innerWidth < 1024) {
      props.history.push('/mobileTip');
    } //待修改
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (pstate.curPoint && pstate.curPoint.status === 'inToCanvas') {
      setRightColla(false);
    }
  }, [pstate.curPoint]);

  const allType = useMemo(() => {
    let arr: string[] = [];
    template.forEach(v => {
      arr.push(v.type);
    });
    mediaTpl.forEach(v => {
      arr.push(v.type);
    });
    graphTpl.forEach(v => {
      arr.push(v.type);
    });
    return arr;
  }, [graphTpl, mediaTpl, template]);

  const [dragstate, setDragState] = useState({ x: 0, y: 0 });

  const ref = useRef<HTMLDivElement>(null);
  const renderRight = useMemo(() => {
    if (context.theme === 'h5') {
      return (
        <div
          ref={ref}
          className={styles.attrSetting}
          style={{
            transition: 'all ease-in-out 0.5s',
            transform: 'translate(0,0)',
            // transform: rightColla ? 'translate(100%,0)' : 'translate(0,0)',
          }}
        >
          {pointData.length && curPoint ? (
            <>
              <div className={styles.tit}>属性设置</div>
              <FormEditor
                config={curPoint.item.editableEl}
                uid={curPoint.id}
                defaultValue={curPoint.item.config}
                onSave={handleFormSave}
                onDel={handleDel}
                rightPannelRef={ref}
              />
            </>
          ) : (
            <div style={{ paddingTop: '100px' }}>
              <Result
                icon=" "
                title="还没有数据"
                subTitle="赶快拖拽组件来制作吧～"
              />
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div
          className={styles.attrSetting}
          style={{
            transition: 'all ease-in-out 0.5s',
            transform: rightColla ? 'translate(100%,0)' : 'translate(0,0)',
          }}
        >
          {cpointData.length && curPoint ? (
            <>
              <div className={styles.tit}>属性设置</div>
              <FormEditor
                config={curPoint.item.editableEl}
                uid={curPoint.id}
                defaultValue={curPoint.item.config}
                onSave={handleFormSave}
                onDel={handleDel}
                rightPannelRef={ref}
              />
            </>
          ) : (
            <div style={{ paddingTop: '100px' }}>
              <Result
                icon={<SmileOutlined />}
                title="还没有数据"
                subTitle="赶快拖拽组件来制作吧～"
              />
            </div>
          )}
        </div>
      );
    }
  }, [
    context.theme,
    cpointData.length,
    curPoint,
    handleDel,
    handleFormSave,
    pointData.length,
    rightColla,
  ]);

  const tabRender = useMemo(() => {
    if (collapsed) {
      return (
        <>
          <TabPane tab={generateHeader('base', '基础')} key="1"></TabPane>
          <TabPane tab={generateHeader('media', '媒体')} key="2"></TabPane>
          <TabPane tab={generateHeader('visible', '可视化')} key="3"></TabPane>
        </>
      );
    } else {
      return (
        <>
          <TabPane tab={generateHeader('base', '基础')} key="1">
            <div className={styles.ctitle}>基础组件</div>
            {template.map((value, i) => {
              // console.log(value,'aaaa---')
              return (
                <TargetBox item={value} key={i} canvasId={canvasId}>
                  <DynamicEngine
                    {...value}
                    config={schemaH5[value.type as keyof typeof schemaH5].config}
                    componentsType="base"
                    isTpl={true}
                  />
                </TargetBox>
              );
            })}
          </TabPane>
          <TabPane tab={generateHeader('media', '媒体')} key="2">
            <div className={styles.ctitle}>媒体组件</div>
            {mediaTpl.map((value, i) => (
              <TargetBox item={value} key={i} canvasId={canvasId}>
                <DynamicEngine
                  {...value}
                  config={schemaH5[value.type as keyof typeof schemaH5].config}
                  componentsType="media"
                  isTpl={true}
                />
              </TargetBox>
            ))}
          </TabPane>
          <TabPane tab={generateHeader('visible', '可视化')} key="3">
            <div className={styles.ctitle}>可视化组件</div>
            {graphTpl.map((value, i) => (
              <TargetBox item={value} key={i} canvasId={canvasId}>
                <DynamicEngine
                  {...value}
                  config={schemaH5[value.type as keyof typeof schemaH5].config}
                  componentsType={'visible' as componentsType}
                  isTpl={true}
                />
              </TargetBox>
            ))}
          </TabPane>
        </>
      );
    }
  }, [canvasId, collapsed, generateHeader, graphTpl, mediaTpl, schemaH5, template]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [diffmove, setDiffMove] = useState({
    start: { x: 0, y: 0 },
    move: false,
  });

  const mousedownfn = useMemo(() => {
    return (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === containerRef.current) {
        setDiffMove({
          start: {
            x: e.clientX,
            y: e.clientY,
          },
          move: true,
        });
      }
    };
  }, []);

  const mousemovefn = useMemo(() => {
    return (e: React.MouseEvent<HTMLDivElement>) => {
      if (diffmove.move) {
        let diffx: number;
        let diffy: number;
        const newX = e.clientX;
        const newY = e.clientY;
        diffx = newX - diffmove.start.x;
        diffy = newY - diffmove.start.y;
        setDiffMove({
          start: {
            x: newX,
            y: newY,
          },
          move: true,
        });
        setDragState(prev => {
          return {
            x: prev.x + diffx,
            y: prev.y + diffy,
          };
        });
      }
    };
  }, [diffmove.move, diffmove.start.x, diffmove.start.y]);

  const mouseupfn = useMemo(() => {
    return () => {
      setDiffMove({
        start: { x: 0, y: 0 },
        move: false,
      });
    };
  }, []);

  const onwheelFn = useMemo(() => {
    return (e: React.WheelEvent<HTMLDivElement>) => {
      if (e.deltaY < 0) {
        setDragState(prev => ({
          x: prev.x,
          y: prev.y + 40,
        }));
      } else {
        setDragState(prev => ({
          x: prev.x,
          y: prev.y - 40,
        }));
      }
    };
  }, []);

  useEffect(() => {
    if (diffmove.move && containerRef.current) {
      containerRef.current.style.cursor = 'move';
    } else {
      containerRef.current!.style.cursor = 'default';
    }
  }, [diffmove.move]);

  return (
    <div className={styles.editorWrap}>

         <div className={styles.hearder}>
          <div className={styles.toolArea}>
              <HeaderComponent
                redohandler={redohandler}
                undohandler={undohandler}
                pointData={pointData}
                clearData={clearData}
                location={props.location}
                importTpl={importTpl}
              />
          </div>
        </div>

        <div className={styles.container}>

          <div className={styles.renderArea}>

            <div className={styles.renderContent}>

            <div
                className={styles.tickMark}
                id="calibration"
                ref={containerRef}
                onMouseDown={mousedownfn}
                onMouseMove={throttle(mousemovefn, 500)}
                onMouseUp={mouseupfn}
                onMouseLeave={mouseupfn}
                onWheel={onwheelFn}
              >

          <div className={styles.tickMarkTop}>
            <Calibration direction="up" id="calibrationUp" multiple={scaleNum} />
          </div>

          <div className={styles.tickMarkLeft}>
            <Calibration direction="right" id="calibrationRight" multiple={scaleNum} />
          </div>

          <SourceBox
            dragState={dragstate}
            setDragState={setDragState}
            scaleNum={scaleNum}
            canvasId={canvasId}
            allType={allType}
          />

          <CanvasControl scaleNum={scaleNum} handleSlider={handleSlider} backSize={backSize} />

           </div>
           {/* tickMark */}

           </div>

         </div>

          <div className={styles.componentArea}>
            <Tabs
                className="editorTabclass"
                onTabClick={() => changeCollapse(false)}
                defaultActiveKey="1"
                tabPosition={'left'}
              >
                {tabRender}
            </Tabs>
          </div>
          <div className={styles.configArea}>
          {renderRight}
          </div>
        </div>
    </div>
  );


};

export default connect((state: StateWithHistory<any>) => {
  console.log(state);
  return { pstate: state.present.editorModal, cstate: state.present.editorPcModal };
})(Container);
