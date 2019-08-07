import React, { useEffect, useMemo, useState } from 'react';
import { Table, Button, Divider, Modal } from 'antd';
import { connect } from 'dva';
import { Link } from 'umi';
import { PaginationConfig } from 'antd/lib/table';
import { ConnectState, ConnectProps, Dispatch } from '@/models/connect';
import { IPerfProfileInfo, IPerfProfile } from '@/models/misc';
import AddMiscReportModal from '@/components/AddMiscReportModal';
import UploadRemoteReportModal from '@/components/UploadRemoteReportModal';
import { CurrentUser } from '@/models/user';
import UploadLocalReportModal from '@/components/UploadLocalReportModal';
import { IFormatInstance } from '@/models/inspection';

const styles = require('../style.less');

const tableColumns = (curUser: CurrentUser, onDelete: any, onUpload: any) => [
  {
    title: 'Profile 报告 ID',
    dataIndex: 'uuid',
    key: 'uuid',
  },
  {
    title: '用户名',
    dataIndex: 'user',
    key: 'user',
  },
  {
    title: '实例名称',
    dataIndex: 'instance_name',
    key: 'instance_name',
  },
  {
    title: '开始时间',
    dataIndex: 'format_create_time',
    key: 'format_create_time',
  },
  {
    title: '完成时间',
    dataIndex: 'format_finish_time',
    key: 'format_finish_time',
    render: (text: any, record: IPerfProfile) => {
      if (record.status === 'running') {
        return <span>running</span>;
      }
      return <span>{text}</span>;
    },
  },
  {
    title: '操作',
    key: 'action',
    render: (text: any, record: IPerfProfile) => (
      <span>
        {record.status === 'running' ? (
          <span>详情</span>
        ) : (
          <Link to={`/misc/perfprofiles/${record.uuid}`}>详情</Link>
        )}
        <Divider type="vertical" />
        {record.status === 'running' ? (
          <span>下载</span>
        ) : (
          <a download href={`/api/v1/perfprofiles/${record.uuid}.tar.gz`}>
            下载
          </a>
        )}
        {curUser.role === 'admin' && curUser.ka && (
          <React.Fragment>
            <Divider type="vertical" />
            {record.status === 'running' ? (
              <span>上传</span>
            ) : (
              <a onClick={() => onUpload(record)}>上传</a>
            )}
          </React.Fragment>
        )}
        <Divider type="vertical" />
        <a style={{ color: 'red' }} onClick={() => onDelete(record)}>
          删除
        </a>
      </span>
    ),
  },
];

interface PerfProfileListProps extends ConnectProps {
  dispatch: Dispatch;

  curUser: CurrentUser;
  perfprofile: IPerfProfileInfo;
  instances: IFormatInstance[];
  loading: boolean;
}

function PerfProfileList({
  dispatch,
  curUser,
  perfprofile,
  instances,
  loading,
}: PerfProfileListProps) {
  const [addReportModalVisble, setAddReportModalVisible] = useState(false);

  const [uploadRemoteModalVisible, setUploadRemoteModalVisible] = useState(false);
  const [uploadRemoteUrl, setUploadRemoteUrl] = useState('');

  const [uploadLocalModalVisible, setUploadLocalModalVisible] = useState(false);

  const pagination: PaginationConfig = useMemo(
    () => ({
      total: perfprofile.total,
      current: perfprofile.cur_page,
    }),
    [perfprofile.total, perfprofile.cur_page],
  );

  useEffect(() => {
    fetchPerfProfiles(perfprofile.cur_page);
  }, []);

  function fetchPerfProfiles(page: number) {
    dispatch({
      type: 'misc/fetchPerfProfiles',
      payload: {
        page,
      },
    });
  }

  const columns = useMemo(() => tableColumns(curUser, deletePerfProfile, uploadPerfProfile), [
    curUser,
  ]);

  function deletePerfProfile(record: IPerfProfile) {
    Modal.confirm({
      title: '删除 Profile 报告？',
      content: '你确定要删除这个 Profile 报告吗？删除后不可恢复',
      okText: '删除',
      okButtonProps: { type: 'danger' },
      onOk() {
        dispatch({
          type: 'misc/deletePerfProfile',
          payload: record.uuid,
        });
      },
    });
  }

  function uploadPerfProfile(record: IPerfProfile) {
    setUploadRemoteModalVisible(true);
    setUploadRemoteUrl(`/perfprofiles/${record.uuid}`);
  }

  function handleAddPerfProfile(instanceId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      dispatch({
        type: 'misc/addPerfProfile',
        payload: instanceId,
      }).then((val: any) => resolve());
    });
  }

  function handleTableChange(curPagination: PaginationConfig) {
    fetchPerfProfiles(curPagination.current as number);
  }

  function handleLocalFileUploaded(res: IPerfProfile) {
    dispatch({
      type: 'misc/savePerfProfile',
      payload: res,
    });
  }

  function showAddReportModal() {
    setAddReportModalVisible(true);
    if (instances.length === 0) {
      dispatch({
        type: 'inspection/fetchInstances',
      });
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.list_header}>
        <h2>Perf Profile 报告列表</h2>
        {curUser.role === 'admin' && (
          <Button type="primary" onClick={showAddReportModal}>
            + 获取
          </Button>
        )}
        {curUser.role === 'dba' && (
          <Button type="primary" onClick={() => setUploadLocalModalVisible(true)}>
            + 导入本地报告
          </Button>
        )}
      </div>
      <Table
        loading={loading}
        dataSource={perfprofile.list}
        columns={columns}
        onChange={handleTableChange}
        pagination={pagination}
      />
      <AddMiscReportModal
        instances={instances}
        visible={addReportModalVisble}
        onClose={() => setAddReportModalVisible(false)}
        onData={handleAddPerfProfile}
      />
      <UploadRemoteReportModal
        visible={uploadRemoteModalVisible}
        onClose={() => setUploadRemoteModalVisible(false)}
        uploadUrl={uploadRemoteUrl}
      />
      <UploadLocalReportModal
        visible={uploadLocalModalVisible}
        onClose={() => setUploadLocalModalVisible(false)}
        actionUrl="/api/v1/perfprofiles"
        onData={handleLocalFileUploaded}
      />
    </div>
  );
}

export default connect(({ user, misc, inspection, loading }: ConnectState) => ({
  curUser: user.currentUser,
  perfprofile: misc.perfprofile,
  instances: inspection.instances,
  loading: loading.effects['misc/fetchPerfProfiles'],
}))(PerfProfileList);